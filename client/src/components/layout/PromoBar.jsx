import { useState } from 'react';
import './PromoBar.scss';

const PromoBar = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="promo-bar">
      <div className="promo-bar__content">
        <p className="promo-bar__text">
          FREE SHIPPING ON ORDERS OVER ৳8,000 | CASH ON DELIVERY AVAILABLE
        </p>
        <button
          className="promo-bar__close"
          onClick={() => setIsVisible(false)}
          aria-label="Close promotional banner"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default PromoBar;
