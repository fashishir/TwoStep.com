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
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <div className="loading" />;
  }

  if (error || !order) {
    return (
      <div className="order-confirmation">
        <div className="container">
          <div className="order-confirmation__error">
            <h2>{error || 'Order not found'}</h2>
            <Link to="/products" className="btn btn--primary">
              Continue Shopping
            </Link>
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

  return (
    <div className="order-confirmation">
      <div className="container">
        <div className="order-confirmation__header">
          <div className="order-confirmation__check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="order-confirmation__title">Order Confirmed</h1>
          <p className="order-confirmation__subtitle">
            Thank you for your purchase! Your order has been placed.
          </p>
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
              <h2>Items</h2>
              <div className="order-confirmation__items">
                {order.items?.map((item) => (
                  <div key={item.id} className="order-confirmation__item">
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
                <span>Free</span>
              </div>
              <div className="order-confirmation__summary-row order-confirmation__summary-row--total">
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>

              <div className="order-confirmation__payment">
                <h3>Payment Method</h3>
                <p>Cash on Delivery</p>
              </div>

              <Link to="/products" className="btn btn--primary btn--full">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
