import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import './Account.scss';

const Account = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll({ limit: 50 });
      if (response.data.success) {
        setOrders(response.data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const statusConfig = {
    pending: { label: 'Pending', color: '#f59e0b', bg: '#fef3c7' },
    processing: { label: 'Processing', color: '#3b82f6', bg: '#dbeafe' },
    shipped: { label: 'Shipped', color: '#8b5cf6', bg: '#ede9fe' },
    delivered: { label: 'Delivered', color: '#10b981', bg: '#d1fae5' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' },
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="account">
      <div className="container">
        <div className="account__header">
          <h1 className="heading heading--md">My Account</h1>
        </div>

        <div className="account__layout">
          <aside className="account__sidebar">
            <div className="account__user-card">
              <div className="account__avatar">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="account__user-info">
                <h3>{user?.firstName} {user?.lastName}</h3>
                <p>{user?.email}</p>
              </div>
            </div>

            <nav className="account__nav">
              <button
                className={`account__nav-link ${activeTab === 'orders' ? 'account__nav-link--active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                Order History
              </button>
              <button
                className={`account__nav-link ${activeTab === 'profile' ? 'account__nav-link--active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile Details
              </button>
              <Link to="/track-order" className="account__nav-link">
                Track Order
              </Link>
              <button className="account__nav-link account__nav-link--logout" onClick={handleLogout}>
                Logout
              </button>
            </nav>
          </aside>

          <main className="account__main">
            {activeTab === 'orders' && (
              <div className="account__orders">
                <h2 className="account__section-title">Order History</h2>

                {loading ? (
                  <div className="loading" />
                ) : orders.length === 0 ? (
                  <div className="account__empty">
                    <p>No orders yet</p>
                    <Link to="/products" className="btn btn--primary">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="account__orders-list">
                    {orders.map((order) => {
                      const status = statusConfig[order.status] || statusConfig.pending;
                      return (
                        <div key={order.id} className="account__order-card">
                          <div className="account__order-header">
                            <div>
                              <span className="account__order-id">Order #{order.id}</span>
                              <span className="account__order-date">
                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <span
                              className="account__order-status"
                              style={{ backgroundColor: status.bg, color: status.color }}
                            >
                              {status.label}
                            </span>
                          </div>

                          <div className="account__order-items">
                            {order.items?.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="account__order-item">
                                <div className="account__order-item-image">
                                  {item.productimage ? (
                                    <img src={item.productimage} alt={item.productname} />
                                  ) : (
                                    <div className="account__order-item-placeholder">No Image</div>
                                  )}
                                </div>
                                <div className="account__order-item-details">
                                  <p className="account__order-item-name">{item.productname}</p>
                                  <p className="account__order-item-qty">Qty: {item.quantity}</p>
                                </div>
                              </div>
                            ))}
                            {order.items?.length > 3 && (
                              <p className="account__order-more">+{order.items.length - 3} more items</p>
                            )}
                          </div>

                          <div className="account__order-footer">
                            <span className="account__order-total">
                              Total: {formatPrice(order.total_amount)}
                            </span>
                            <div className="account__order-actions">
                              <Link to={`/order-confirmation/${order.id}`} className="btn btn--secondary btn--sm">
                                View Details
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="account__profile">
                <h2 className="account__section-title">Profile Details</h2>
                <div className="account__profile-card">
                  <div className="account__profile-row">
                    <span className="account__profile-label">Name</span>
                    <span className="account__profile-value">{user?.firstName} {user?.lastName}</span>
                  </div>
                  <div className="account__profile-row">
                    <span className="account__profile-label">Email</span>
                    <span className="account__profile-value">{user?.email}</span>
                  </div>
                  <div className="account__profile-row">
                    <span className="account__profile-label">Phone</span>
                    <span className="account__profile-value">{user?.phone || 'Not provided'}</span>
                  </div>
                  <div className="account__profile-row">
                    <span className="account__profile-label">Role</span>
                    <span className="account__profile-value account__profile-value--capitalize">{user?.role}</span>
                  </div>
                  <div className="account__profile-row">
                    <span className="account__profile-label">Member Since</span>
                    <span className="account__profile-value">
                      {new Date(user?.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Account;
