import { useState, useEffect, useCallback } from 'react';
import { ordersAPI } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';
import { FiEye, FiX, FiPackage, FiTruck, FiCheck, FiPhone, FiMapPin, FiCalendar } from 'react-icons/fi';
import './AdminPages.scss';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 10 };
      if (statusFilter) params.status = statusFilter;

      const response = await ordersAPI.getAll(params);
      if (response.data.success) {
        setOrders(response.data.data.items);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, statusFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus, `Status changed to ${newStatus}`);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const handlePaymentChange = async (orderId, paymentStatus) => {
    try {
      await ordersAPI.updatePayment(orderId, paymentStatus);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, payment_status: paymentStatus }));
      }
    } catch (error) {
      console.error('Failed to update payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const statusColors = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
  };

  const paymentColors = {
    pending: '#f59e0b',
    paid: '#10b981',
    failed: '#ef4444',
    refunded: '#8b5cf6',
  };

  const statusIcons = {
    pending: <FiPackage size={14} />,
    processing: <FiPackage size={14} />,
    shipped: <FiTruck size={14} />,
    delivered: <FiCheck size={14} />,
    cancelled: <FiX size={14} />,
  };

  const normalizeItems = (items) => {
    if (!items) return [];
    return items.map(item => ({
      id: item.id,
      productName: item.productName || item.productname || 'Unknown',
      productImage: item.productImage || item.productimage || null,
      quantity: item.quantity || 0,
      priceAtPurchase: item.priceAtPurchase || item.priceatpurchase || 0,
    }));
  };

  if (loading && orders.length === 0) return <div className="loading" />;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h2>Orders ({pagination.total})</h2>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
          className="admin-page__filter"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="admin-page__table-wrapper admin-page__table-wrapper--desktop">
        <table className="admin-page__table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#757575' }}>
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>#{order.id}</strong>
                    {order.tracking_id && (
                      <><br /><small style={{ color: '#757575', fontSize: '11px' }}>{order.tracking_id}</small></>
                    )}
                  </td>
                  <td>
                    <div>
                      <p style={{ fontWeight: 600 }}>{order.first_name} {order.last_name}</p>
                      <p className="admin-page__email">{order.user_email}</p>
                    </div>
                  </td>
                  <td>{order.items?.length || 0}</td>
                  <td>{formatPrice(order.total_amount)}</td>
                  <td>
                    <span className="admin-page__status" style={{ backgroundColor: paymentColors[order.payment_status] || '#e0e0e0', color: '#fff' }}>
                      {order.payment_status || 'pending'}
                    </span>
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="admin-page__status-select"
                      style={{ borderColor: statusColors[order.status] || '#e0e0e0' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-page__actions">
                      <button onClick={() => setSelectedOrder(order)} className="admin-page__action-btn" title="View Details">
                        <FiEye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="admin-page__card-list">
        {orders.length === 0 ? (
          <div className="admin-page__empty">No orders found</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="admin-order-card">
              <div className="admin-order-card__header">
                <div>
                  <strong>#{order.id}</strong>
                  {order.tracking_id && (
                    <span className="admin-order-card__tracking">{order.tracking_id}</span>
                  )}
                </div>
                <span
                  className="admin-order-card__status"
                  style={{ backgroundColor: statusColors[order.status] + '20', color: statusColors[order.status] }}
                >
                  {statusIcons[order.status]}
                  {order.status}
                </span>
              </div>
              <div className="admin-order-card__customer">
                <FiUser size={14} />
                <span>{order.first_name} {order.last_name}</span>
              </div>
              <div className="admin-order-card__row">
                <span>Items: {order.items?.length || 0}</span>
                <strong>{formatPrice(order.total_amount)}</strong>
              </div>
              <div className="admin-order-card__row">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className="admin-page__status-select"
                  style={{ borderColor: statusColors[order.status] || '#e0e0e0', fontSize: '12px' }}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button onClick={() => setSelectedOrder(order)} className="btn btn--secondary btn--sm">
                  <FiEye size={14} /> View
                </button>
              </div>
              <div className="admin-order-card__date">
                <FiCalendar size={12} />
                {new Date(order.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="admin-page__pagination">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </button>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="admin-modal">
          <div className="admin-modal__overlay" onClick={() => setSelectedOrder(null)} />
          <div className="admin-modal__content" style={{ maxWidth: '700px' }}>
            <div className="admin-modal__header">
              <h3>Order #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="admin-modal__close">
                <FiX size={20} />
              </button>
            </div>

            <div className="admin-modal__body">
              {/* Status Badge */}
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 700,
                  textTransform: 'uppercase', backgroundColor: statusColors[selectedOrder.status] + '20',
                  color: statusColors[selectedOrder.status], display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {statusIcons[selectedOrder.status]} {selectedOrder.status}
                </span>
                <span style={{ fontSize: '13px', color: '#757575' }}>
                  {new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Customer Info */}
              <div className="admin-order__section">
                <h4><FiPhone size={14} /> Customer Information</h4>
                <p><strong>{selectedOrder.first_name} {selectedOrder.last_name}</strong></p>
                <p style={{ color: '#757575' }}>{selectedOrder.user_email}</p>
              </div>

              {/* Shipping Address */}
              <div className="admin-order__section">
                <h4><FiMapPin size={14} /> Shipping Address</h4>
                <p>{selectedOrder.shipping_address}</p>
                <p>{selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_zip}</p>
                <p>{selectedOrder.shipping_country}</p>
              </div>

              {/* Items */}
              <div className="admin-order__section">
                <h4>Order Items ({normalizeItems(selectedOrder.items).length})</h4>
                {normalizeItems(selectedOrder.items).map((item, idx) => (
                  <div key={item.id || idx} className="admin-order__item">
                    <div className="admin-order__item-image">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} />
                      ) : (
                        <div className="admin-page__no-image"><FiPackage size={14} /></div>
                      )}
                    </div>
                    <div className="admin-order__item-details">
                      <p className="admin-order__item-name">{item.productName}</p>
                      <p style={{ color: '#757575', fontSize: '13px' }}>
                        Qty: {item.quantity} × {formatPrice(item.priceAtPurchase)}
                      </p>
                    </div>
                    <p className="admin-order__item-total">
                      {formatPrice(item.quantity * item.priceAtPurchase)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Payment & Total */}
              <div className="admin-order__section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h4 style={{ marginBottom: '8px' }}>Payment</h4>
                    <p style={{ fontSize: '14px' }}>Method: <strong>Cash on Delivery</strong></p>
                    <p style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                      Status: <strong style={{ color: paymentColors[selectedOrder.payment_status] }}>
                        {selectedOrder.payment_status || 'pending'}
                      </strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px', color: '#757575', textTransform: 'uppercase' }}>Total</p>
                    <p className="admin-order__total" style={{ fontSize: '24px', fontWeight: 800 }}>
                      {formatPrice(selectedOrder.total_amount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="admin-order__section">
                <h4>Quick Actions</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedOrder.status === 'pending' && (
                    <button onClick={() => handleStatusChange(selectedOrder.id, 'processing')} className="btn btn--primary btn--sm">
                      <FiPackage size={14} /> Start Processing
                    </button>
                  )}
                  {selectedOrder.status === 'processing' && (
                    <button onClick={() => handleStatusChange(selectedOrder.id, 'shipped')} className="btn btn--primary btn--sm">
                      <FiTruck size={14} /> Mark as Shipped
                    </button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button onClick={() => handleStatusChange(selectedOrder.id, 'delivered')} className="btn btn--primary btn--sm">
                      <FiCheck size={14} /> Mark as Delivered
                    </button>
                  )}
                  {selectedOrder.payment_status === 'pending' && (
                    <button onClick={() => handlePaymentChange(selectedOrder.id, 'paid')} className="btn btn--secondary btn--sm">
                      <FiCheck size={14} /> Mark as Paid
                    </button>
                  )}
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                      className="btn btn--secondary btn--sm"
                      style={{ borderColor: '#ef4444', color: '#ef4444' }}
                    >
                      <FiX size={14} /> Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
