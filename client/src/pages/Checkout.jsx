import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import { formatPrice, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../utils/formatPrice';
import './Checkout.scss';

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingCountry: 'United States',
    notes: '',
  });

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shippingCost;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: formData.shippingAddress,
        shippingCity: formData.shippingCity,
        shippingState: formData.shippingState,
        shippingZip: formData.shippingZip,
        shippingCountry: formData.shippingCountry,
        notes: formData.notes,
      };

      const response = await ordersAPI.create(orderData);
      if (response.data.success) {
        clearCart();
        navigate(`/order-confirmation/${response.data.data.id}`);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout">
      <div className="container">
        <h1 className="heading heading--md">Checkout</h1>

        {error && <div className="checkout__error">{error}</div>}

        <div className="checkout__layout">
          <form className="checkout__form" onSubmit={handleSubmit}>
            <div className="checkout__section">
              <h2 className="checkout__section-title">Shipping Information</h2>

              <div className="checkout__field">
                <label htmlFor="shippingAddress">Address</label>
                <input
                  type="text"
                  id="shippingAddress"
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="checkout__row">
                <div className="checkout__field">
                  <label htmlFor="shippingCity">City</label>
                  <input
                    type="text"
                    id="shippingCity"
                    name="shippingCity"
                    value={formData.shippingCity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="checkout__field">
                  <label htmlFor="shippingState">State</label>
                  <input
                    type="text"
                    id="shippingState"
                    name="shippingState"
                    value={formData.shippingState}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="checkout__row">
                <div className="checkout__field">
                  <label htmlFor="shippingZip">ZIP Code</label>
                  <input
                    type="text"
                    id="shippingZip"
                    name="shippingZip"
                    value={formData.shippingZip}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="checkout__field">
                  <label htmlFor="shippingCountry">Country</label>
                  <input
                    type="text"
                    id="shippingCountry"
                    name="shippingCountry"
                    value={formData.shippingCountry}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="checkout__field">
                <label htmlFor="notes">Order Notes (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

            <div className="checkout__section">
              <h2 className="checkout__section-title">Payment Method</h2>
              <div className="checkout__payment-option checkout__payment-option--active">
                <div className="checkout__payment-radio">
                  <input type="radio" name="payment" checked readOnly />
                  <span className="checkout__payment-checkmark"></span>
                </div>
                <div className="checkout__payment-info">
                  <h3>Cash on Delivery</h3>
                  <p>Pay when you receive your order</p>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>

          <div className="checkout__summary">
            <h2 className="checkout__section-title">Order Summary</h2>

            <div className="checkout__items">
              {items.map((item) => (
                <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`} className="checkout__item">
                  <div className="checkout__item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="checkout__item-placeholder">No Image</div>
                    )}
                  </div>
                  <div className="checkout__item-details">
                    <h3>{item.name}</h3>
                    {item.selectedSize && <p>Size: {item.selectedSize}</p>}
                    {item.selectedColor && <p>Color: {item.selectedColor}</p>}
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <p className="checkout__item-price">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="checkout__totals">
              <div className="checkout__total-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="checkout__total-row">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
              </div>
              <div className="checkout__total-row checkout__total-row--total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
