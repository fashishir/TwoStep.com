import { useState } from 'react';
import { ordersAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import './OrderTracking.scss';

const OrderTracking = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await ordersAPI.getTrack(orderId.trim());
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setError(response.data.message || 'Order not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found. Please check your Order ID.');
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];
  const statusConfig = {
    pending: { label: 'Pending', color: '#f59e0b', bg: '#fef3c7' },
    processing: { label: 'Processing', color: '#3b82f6', bg: '#dbeafe' },
    shipped: { label: 'Shipped', color: '#8b5cf6', bg: '#ede9fe' },
    delivered: { label: 'Delivered', color: '#10b981', bg: '#d1fae5' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' },
  };

  const getActiveStep = (status) => {
    if (status === 'cancelled') return -1;
    return statusSteps.indexOf(status);
  };

  // Normalize item field names
  const normalizeItem = (item) => ({
    id: item.id,
    productName: item.productName || item.productname || 'Unknown Product',
    productImage: item.productImage || item.productimage || null,
    quantity: item.quantity || 0,
    priceAtPurchase: item.priceAtPurchase || item.priceatpurchase || 0,
  });

  return (
    <div className="order-tracking">
      <div className="container">
        <div className="order-tracking__header">
          <h1 className="heading heading--md">Track Your Order</h1>
          <p className="order-tracking__subtitle">Enter your Order ID to see the status and tracking details</p>
        </div>

        <form className="order-tracking__search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Enter Order ID (e.g. 1)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="order-tracking__input"
          />
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </form>

        {error && (
          <div className="order-tracking__error">{error}</div>
        )}

        {order && (
          <div className="order-tracking__result">
            <div className="order-tracking__order-header">
              <div>
                <h2>Order #{order.id}</h2>
                <p className="order-tracking__date">
                  Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
              <span
                className="order-tracking__status-badge"
                style={{
                  backgroundColor: statusConfig[order.status]?.bg,
                  color: statusConfig[order.status]?.color,
                }}
              >
                {statusConfig[order.status]?.label || order.status}
              </span>
            </div>

            {/* Progress Bar */}
            {order.status !== 'cancelled' && (
              <div className="order-tracking__progress">
                {statusSteps.map((step, index) => {
                  const isActive = index <= getActiveStep(order.status);
                  const isCurrent = statusSteps[getActiveStep(order.status)] === step;
                  return (
                    <div
                      key={step}
                      className={`order-tracking__step ${isActive ? 'order-tracking__step--active' : ''} ${isCurrent ? 'order-tracking__step--current' : ''}`}
                    >
                      <div className="order-tracking__step-dot" />
                      <span className="order-tracking__step-label">
                        {statusConfig[step]?.label}
                      </span>
                      {index < statusSteps.length - 1 && (
                        <div className={`order-tracking__step-line ${isActive ? 'order-tracking__step-line--active' : ''}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {order.status === 'cancelled' && (
              <div className="order-tracking__cancelled">
                This order has been cancelled.
              </div>
            )}

            {/* Tracking Info */}
            {(order.tracking_number || order.carrier || order.estimated_delivery) && (
              <div className="order-tracking__info-card">
                <h3>Shipping Details</h3>
                <div className="order-tracking__info-grid">
                  {order.tracking_number && (
                    <div className="order-tracking__info-item">
                      <span className="order-tracking__info-label">Tracking Number</span>
                      <span className="order-tracking__info-value">{order.tracking_number}</span>
                    </div>
                  )}
                  {order.carrier && (
                    <div className="order-tracking__info-item">
                      <span className="order-tracking__info-label">Carrier</span>
                      <span className="order-tracking__info-value">{order.carrier}</span>
                    </div>
                  )}
                  {order.estimated_delivery && (
                    <div className="order-tracking__info-item">
                      <span className="order-tracking__info-label">Estimated Delivery</span>
                      <span className="order-tracking__info-value">
                        {new Date(order.estimated_delivery).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {order.delivered_at && (
                    <div className="order-tracking__info-item">
                      <span className="order-tracking__info-label">Delivered On</span>
                      <span className="order-tracking__info-value">
                        {new Date(order.delivered_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="order-tracking__items-card">
              <h3>Order Items</h3>
              <div className="order-tracking__items">
                {(order.items || []).map((item, idx) => {
                  const normalized = normalizeItem(item);
                  return (
                    <div key={normalized.id || idx} className="order-tracking__item">
                      <div className="order-tracking__item-image">
                        {normalized.productImage ? (
                          <img src={normalized.productImage} alt={normalized.productName} />
                        ) : (
                          <div className="order-tracking__item-placeholder">No Image</div>
                        )}
                      </div>
                      <div className="order-tracking__item-details">
                        <p className="order-tracking__item-name">{normalized.productName}</p>
                        <p className="order-tracking__item-qty">Qty: {normalized.quantity}</p>
                      </div>
                      <p className="order-tracking__item-price">
                        {formatPrice(normalized.priceAtPurchase * normalized.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="order-tracking__total">
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>

            {/* Timeline */}
            {order.history?.length > 0 && (
              <div className="order-tracking__timeline-card">
                <h3>Order Timeline</h3>
                <div className="order-tracking__timeline">
                  {order.history.map((entry, idx) => (
                    <div key={idx} className="order-tracking__timeline-item">
                      <div className="order-tracking__timeline-dot" />
                      <div className="order-tracking__timeline-content">
                        <span className="order-tracking__timeline-status">
                          {statusConfig[entry.status]?.label || entry.status}
                        </span>
                        <p className="order-tracking__timeline-note">{entry.note}</p>
                        {entry.tracking_number && (
                          <p className="order-tracking__timeline-detail">
                            Tracking: {entry.tracking_number} ({entry.carrier})
                          </p>
                        )}
                        <span className="order-tracking__timeline-date">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Address */}
            <div className="order-tracking__address-card">
              <h3>Shipping Address</h3>
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
              <p>{order.shipping_country}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
