import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import './OrderConfirmation.scss';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await ordersAPI.getById(orderId);
        if (response.data.success) {
          setOrder(response.data.data);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError(err.response?.data?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="order-confirmation">
        <div className="container">
          <div className="loading" style={{ minHeight: '400px' }}>
            <p style={{ marginTop: '16px', color: '#757575' }}>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-confirmation">
        <div className="container">
          <div className="order-confirmation__error">
            <div className="order-confirmation__error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>{error || 'Order not found'}</h2>
            <p>The order you're looking for doesn't exist or may have been removed.</p>
            <div className="order-confirmation__error-actions">
              <Link to="/products" className="btn btn--primary">
                Continue Shopping
              </Link>
              <Link to="/track-order" className="btn btn--secondary">
                Track Another Order
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: { label: 'Pending', color: '#f59e0b', bg: '#fef3c7' },
    processing: { label: 'Processing', color: '#3b82f6', bg: '#dbeafe' },
    shipped: { label: 'Shipped', color: '#8b5cf6', bg: '#ede9fe' },
    delivered: { label: 'Delivered', color: '#10b981', bg: '#d1fae5' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' },
  };

  const status = statusConfig[order.status] || statusConfig.pending;

  // Normalize items - handle both camelCase and lowercase field names
  const items = (order.items || []).map(item => ({
    id: item.id,
    productName: item.productName || item.productname || 'Unknown Product',
    productImage: item.productImage || item.productimage || null,
    quantity: item.quantity,
    priceAtPurchase: item.priceAtPurchase || item.priceatpurchase || 0,
  }));

  return (
    <div className="order-confirmation">
      <div className="container">
        <div className="order-confirmation__header">
          <div className="order-confirmation__check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="order-confirmation__title">Order Confirmed!</h1>
          <p className="order-confirmation__subtitle">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
          {order.tracking_id && (
            <p className="order-confirmation__tracking">
              Tracking ID: <strong>{order.tracking_id}</strong>
            </p>
          )}
        </div>

        <div className="order-confirmation__layout">
          <div className="order-confirmation__main">
            <div className="order-confirmation__section">
              <div className="order-confirmation__section-header">
                <h2>Order Details</h2>
                <span className="order-confirmation__order-id">#{order.id}</span>
              </div>

              <div className="order-confirmation__status">
                <span
                  className="order-confirmation__status-badge"
                  style={{ backgroundColor: status.bg, color: status.color }}
                >
                  {status.label}
                </span>
                <span className="order-confirmation__date">
                  Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="order-confirmation__section">
              <h2>Items ({items.length})</h2>
              <div className="order-confirmation__items">
                {items.map((item, index) => (
                  <div key={item.id || index} className="order-confirmation__item">
                    <div className="order-confirmation__item-image">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} />
                      ) : (
                        <div className="order-confirmation__item-placeholder">No Image</div>
                      )}
                    </div>
                    <div className="order-confirmation__item-details">
                      <h3>{item.productName}</h3>
                      <p>Qty: {item.quantity}</p>
                    </div>
                    <p className="order-confirmation__item-price">
                      {formatPrice(item.priceAtPurchase * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-confirmation__section">
              <h2>Shipping Address</h2>
              <p className="order-confirmation__address">
                {order.shipping_address}
                <br />
                {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
                <br />
                {order.shipping_country}
              </p>
            </div>

            {order.notes && (
              <div className="order-confirmation__section">
                <h2>Order Notes</h2>
                <p className="order-confirmation__address">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="order-confirmation__sidebar">
            <div className="order-confirmation__summary">
              <h2>Order Summary</h2>

              <div className="order-confirmation__summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
              <div className="order-confirmation__summary-row">
                <span>Shipping</span>
                <span className="order-confirmation__free-shipping">Free</span>
              </div>
              <div className="order-confirmation__summary-row order-confirmation__summary-row--total">
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>

              <div className="order-confirmation__payment">
                <h3>Payment Method</h3>
                <p>Cash on Delivery</p>
              </div>

              <div className="order-confirmation__payment">
                <h3>Payment Status</h3>
                <p style={{ textTransform: 'capitalize' }}>{order.payment_status || 'Pending'}</p>
              </div>

              <Link to="/products" className="btn btn--primary btn--full">
                Continue Shopping
              </Link>

              <Link to="/track-order" className="btn btn--secondary btn--full" style={{ marginTop: '12px' }}>
                Track Your Order
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
