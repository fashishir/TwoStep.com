const pool = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const crypto = require('crypto');

const generateTrackingId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = (len) => {
    let result = '';
    const bytes = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  };
  return `ORD-${segment(4)}-${segment(4)}`;
};

const createOrder = async (req, res) => {
  const { items, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry, notes } = req.body;

  // Validate before opening a transaction so we never leave a connection
  // with an open transaction in the pool.
  if (!items || items.length === 0) {
    return errorResponse(res, 'Order must contain at least one item', 400);
  }

  if (!shippingAddress || !shippingCity || !shippingState || !shippingZip) {
    return errorResponse(res, 'Shipping address is required', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const productResult = await client.query(
        `SELECT id, name, price, sale_price, stock_quantity, 
          (SELECT image_url FROM product_images WHERE product_id = products.id AND is_primary = true LIMIT 1) as primary_image
         FROM products WHERE id = $1 AND is_active = true`,
        [item.productId]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return errorResponse(res, `Product with ID ${item.productId} not found`, 400);
      }

      const product = productResult.rows[0];

      if (product.stock_quantity < item.quantity) {
        await client.query('ROLLBACK');
        return errorResponse(res, `Insufficient stock for ${product.name}`, 400);
      }

      const itemPrice = product.sale_price || product.price;
      totalAmount += itemPrice * item.quantity;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtPurchase: itemPrice,
        productName: product.name,
        productImage: product.primary_image,
      });

      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, product.id]
      );
    }

    // Generate unique tracking ID
    let trackingId;
    let isUnique = false;
    while (!isUnique) {
      trackingId = generateTrackingId();
      const existing = await client.query('SELECT id FROM orders WHERE tracking_id = $1', [trackingId]);
      isUnique = existing.rows.length === 0;
    }

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, tracking_id, total_amount, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, notes, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'cash_on_delivery')
       RETURNING *`,
      [req.user.id, trackingId, totalAmount, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry || 'United States', notes]
    );

    const order = orderResult.rows[0];

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, product_name, product_image)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.productId, item.quantity, item.priceAtPurchase, item.productName, item.productImage]
      );
    }

    // Log initial status to history inside the same transaction so the
    // order and its first history entry are committed atomically.
    await client.query(
      `INSERT INTO order_status_history (order_id, status, note) VALUES ($1, 'pending', 'Order placed')`,
      [order.id]
    );

    await client.query('COMMIT');

    const fullOrder = await pool.query(
      `SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id, 'productId', oi.product_id, 'quantity', oi.quantity,
          'priceAtPurchase', oi.price_at_purchase, 'productName', oi.product_name, 'productImage', oi.product_image
        )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [order.id]
    );

    successResponse(res, fullOrder.rows[0], 'Order placed successfully', 201);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    errorResponse(res, 'Failed to create order', 500);
  } finally {
    client.release();
  }
};

const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, 
        u.email as user_email, u.first_name, u.last_name,
        json_agg(json_build_object(
          'id', oi.id, 'productId', oi.product_id, 'quantity', oi.quantity,
          'priceAtPurchase', oi.price_at_purchase, 'productName', oi.product_name, 'productImage', oi.product_image
        )) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    const params = [];
    let paramIndex = 1;

    const conditions = [];

    if (req.user.role === 'customer') {
      conditions.push(`o.user_id = $${paramIndex}`);
      params.push(req.user.id);
      paramIndex++;
    } else if (userId) {
      conditions.push(`o.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (status) {
      conditions.push(`o.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY o.id, u.email, u.first_name, u.last_name';

    const countQuery = `
      SELECT COUNT(*) FROM orders o
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    paginatedResponse(res, result.rows, total, page, limit);
  } catch (error) {
    console.error('Get orders error:', error);
    errorResponse(res, 'Failed to fetch orders', 500);
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT o.*, u.email as user_email, u.first_name, u.last_name,
        json_agg(json_build_object(
          'id', oi.id, 'productId', oi.product_id, 'quantity', oi.quantity,
          'priceAtPurchase', oi.price_at_purchase, 'productName', oi.product_name, 'productImage', oi.product_image
        )) as items
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id, u.email, u.first_name, u.last_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Order not found', 404);
    }

    const order = result.rows[0];

    if (req.user.role === 'customer' && order.user_id !== req.user.id) {
      return errorResponse(res, 'Access denied', 403);
    }

    successResponse(res, order);
  } catch (error) {
    console.error('Get order error:', error);
    errorResponse(res, 'Failed to fetch order', 500);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, carrier, estimatedDelivery, note } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    const existing = await pool.query('SELECT id, status FROM orders WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return errorResponse(res, 'Order not found', 404);
    }

    const updateFields = ['status = $1', 'updated_at = NOW()'];
    const updateParams = [status];
    let paramIndex = 2;

    if (trackingNumber !== undefined) {
      updateFields.push(`tracking_number = $${paramIndex}`);
      updateParams.push(trackingNumber);
      paramIndex++;
    }
    if (carrier !== undefined) {
      updateFields.push(`carrier = $${paramIndex}`);
      updateParams.push(carrier);
      paramIndex++;
    }
    if (estimatedDelivery !== undefined) {
      updateFields.push(`estimated_delivery = $${paramIndex}`);
      updateParams.push(estimatedDelivery);
      paramIndex++;
    }
    if (status === 'delivered') {
      updateFields.push(`delivered_at = NOW()`);
    }

    updateParams.push(id);
    const result = await pool.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateParams
    );

    // Log to status history
    await pool.query(
      `INSERT INTO order_status_history (order_id, status, note, tracking_number, carrier)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, status, note || `Status changed to ${status}`, trackingNumber || null, carrier || null]
    );

    if (status === 'cancelled') {
      const orderItems = await pool.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [id]);
      for (const item of orderItems.rows) {
        await pool.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    successResponse(res, result.rows[0], 'Order status updated');
  } catch (error) {
    console.error('Update order status error:', error);
    errorResponse(res, 'Failed to update order status', 500);
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return errorResponse(res, 'Invalid payment status', 400);
    }

    const existing = await pool.query('SELECT id FROM orders WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return errorResponse(res, 'Order not found', 404);
    }

    const result = await pool.query(
      'UPDATE orders SET payment_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [paymentStatus, id]
    );

    successResponse(res, result.rows[0], 'Payment status updated');
  } catch (error) {
    console.error('Update payment status error:', error);
    errorResponse(res, 'Failed to update payment status', 500);
  }
};

const getOrderStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN total_amount ELSE 0 END), 0) as monthly_revenue
      FROM orders
    `);

    successResponse(res, stats.rows[0]);
  } catch (error) {
    console.error('Get order stats error:', error);
    errorResponse(res, 'Failed to fetch order stats', 500);
  }
};

const getOrderByTrackingId = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const result = await pool.query(
      `SELECT o.id, o.tracking_id, o.status, o.tracking_number, o.carrier, o.estimated_delivery,
              o.delivered_at, o.created_at, o.updated_at, o.total_amount,
              o.shipping_address, o.shipping_city, o.shipping_state, o.shipping_zip, o.shipping_country,
              json_agg(json_build_object(
                'productName', oi.product_name, 'quantity', oi.quantity,
                'priceAtPurchase', oi.price_at_purchase, 'productImage', oi.product_image
              )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.tracking_id = $1
       GROUP BY o.id`,
      [trackingId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Order not found', 404);
    }

    const history = await pool.query(
      `SELECT status, note, tracking_number, carrier, created_at
       FROM order_status_history
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [result.rows[0].id]
    );

    successResponse(res, {
      ...result.rows[0],
      history: history.rows,
    });
  } catch (error) {
    console.error('Get order by tracking error:', error);
    errorResponse(res, 'Failed to fetch order', 500);
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT id, user_id FROM orders WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return errorResponse(res, 'Order not found', 404);
    }

    if (req.user.role === 'customer' && existing.rows[0].user_id !== req.user.id) {
      return errorResponse(res, 'Access denied', 403);
    }

    const history = await pool.query(
      `SELECT status, note, tracking_number, carrier, created_at
       FROM order_status_history
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    successResponse(res, history.rows);
  } catch (error) {
    console.error('Get order history error:', error);
    errorResponse(res, 'Failed to fetch order history', 500);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
  getOrderByTrackingId,
  getOrderHistory,
};
