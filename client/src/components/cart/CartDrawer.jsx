import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatPrice';
import { FiX, FiTrash2 } from 'react-icons/fi';
import './CartDrawer.scss';

const CartDrawer = () => {
  const { items, removeItem, updateQuantity, isCartOpen, toggleCart, subtotal } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isCartOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={toggleCart} />
      <div className="cart-drawer">
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">Shopping Bag</h2>
          <button className="cart-drawer__close" onClick={toggleCart} aria-label="Close cart">
            <FiX size={24} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <p>Your bag is empty</p>
            <Link to="/products" className="btn btn--primary" onClick={toggleCart}>
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-drawer__items">
              {items.map((item) => (
                <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`} className="cart-item">
                  <div className="cart-item__image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="cart-item__placeholder">No Image</div>
                    )}
                  </div>

                  <div className="cart-item__details">
                    <h3 className="cart-item__name">{item.name}</h3>
                    {item.selectedSize && (
                      <p className="cart-item__option">Size: {item.selectedSize}</p>
                    )}
                    {item.selectedColor && (
                      <p className="cart-item__option">Color: {item.selectedColor}</p>
                    )}
                    <p className="cart-item__price">{formatPrice(item.price)}</p>

                    <div className="cart-item__actions">
                      <div className="cart-item__quantity">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1, item.selectedSize, item.selectedColor)
                          }
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1, item.selectedSize, item.selectedColor)
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="cart-item__remove"
                        onClick={() => removeItem(item.productId, item.selectedSize, item.selectedColor)}
                        aria-label="Remove item"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-drawer__footer">
              <div className="cart-drawer__subtotal">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="cart-drawer__shipping-note">
                Shipping calculated at checkout. Cash on Delivery available.
              </p>
              {isAuthenticated ? (
                <Link to="/checkout" className="btn btn--primary btn--full" onClick={toggleCart}>
                  Proceed to Checkout
                </Link>
              ) : (
                <Link to="/login" className="btn btn--primary btn--full" onClick={toggleCart}>
                  Login to Checkout
                </Link>
              )}
              <Link to="/products" className="cart-drawer__continue" onClick={toggleCart}>
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
