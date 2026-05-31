import { useState, useEffect } from 'react';
import { ordersAPI } from '../../services/api';
import { formatPrice, formatPriceInt } from '../../utils/formatPrice';
import { FiEye, FiCheck, FiX } from 'react-icons/fi';
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

  const fetchOrders = async () => {
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
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const handlePaymentChange = async (orderId, paymentStatus) => {
    try {
      await ordersAPI.updatePayment(orderId, paymentStatus);
      fetchOrders();
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

  if (loading) {
    return <div className="loading" />;
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h2>Orders ({pagination.total})</h2>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}
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

      <div className="admin-page__table-wrapper">
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
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>
                  <div>
                    <p>{order.first_name} {order.last_name}</p>
                    <p className="admin-page__email">{order.user_email}</p>
                  </div>
                </td>
                <td>{order.items?.length || 0}</td>
                <td>{formatPrice(order.total_amount)}</td>
                <td>
                  <span
                    className="admin-page__status"
                    style={{ backgroundColor: paymentColors[order.payment_status] }}
                  >
                    {order.payment_status}
                  </span>
                </td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="admin-page__status-select"
                    style={{ borderColor: statusColors[order.status] }}
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
                    <button onClick={() => setSelectedOrder(order)} className="admin-page__action-btn">
                      <FiEye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="admin-page__pagination">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </button>
        </div>
      )}

      {selectedOrder && (
        <div className="admin-modal">
          <div className="admin-modal__overlay" onClick={() => setSelectedOrder(null)} />
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>Order #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="admin-modal__close">
                <FiX size={20} />
              </button>
            </div>

            <div className="admin-modal__body">
              <div className="admin-order__section">
                <h4>Customer Info</h4>
                <p>{selectedOrder.first_name} {selectedOrder.last_name}</p>
                <p>{selectedOrder.user_email}</p>
                <p>{selectedOrder.shipping_address}</p>
                <p>{selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_zip}</p>
              </div>

              <div className="admin-order__section">
                <h4>Items</h4>
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="admin-order__item">
                    <div className="admin-order__item-image">
                      {item.productimage ? (
                        <img src={item.productimage} alt={item.productname} />
                      ) : (
                        <div className="admin-page__no-image">No Image</div>
                      )}
                    </div>
                    <div className="admin-order__item-details">
                      <p className="admin-order__item-name">{item.productname}</p>
                      <p>Qty: {item.quantity} x {formatPrice(item.priceatpurchase)}</p>
                    </div>
                    <p className="admin-order__item-total">
                      {formatPrice(item.quantity * item.priceatpurchase)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="admin-order__section">
                <h4>Payment</h4>
                <p>Method: Cash on Delivery</p>
                <div className="admin-order__payment-actions">
                  <button
                    onClick={() => handlePaymentChange(selectedOrder.id, 'paid')}
                    className="btn btn--primary btn--sm"
                  >
                    <FiCheck size={14} />
                    Mark as Paid
                  </button>
                </div>
              </div>

              <div className="admin-order__section">
                <h4>Total</h4>
                <p className="admin-order__total">{formatPrice(selectedOrder.total_amount)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
