import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatPrice';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import './ProductCard.scss';

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const hasDiscount = product.sale_price && product.sale_price < product.price;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-card__image-wrapper">
        {primaryImage ? (
          <img
            src={primaryImage.image_url}
            alt={primaryImage.alt_text || product.name}
            className="product-card__image"
            loading="lazy"
          />
        ) : (
          <div className="product-card__placeholder">
            <span>No Image</span>
          </div>
        )}

        {hasDiscount && (
          <span className="product-card__badge">Sale</span>
        )}

        <button
          className={`product-card__wishlist ${isWishlisted ? 'product-card__wishlist--active' : ''}`}
          onClick={handleWishlist}
          aria-label="Add to wishlist"
        >
          <FiHeart size={18} fill={isWishlisted ? '#000' : 'none'} />
        </button>

        {product.stock_quantity > 0 && (
          <button
            className={`product-card__add-btn ${isHovered ? 'product-card__add-btn--visible' : ''}`}
            onClick={handleAddToCart}
          >
            <FiShoppingBag size={16} />
            Add to Bag
          </button>
        )}

        {product.stock_quantity === 0 && (
          <div className="product-card__sold-out">Sold Out</div>
        )}
      </div>

      <div className="product-card__info">
        <h3 className="product-card__name">{product.name}</h3>

        <div className="product-card__pricing">
          {hasDiscount ? (
            <>
              <span className="product-card__price product-card__price--sale">
                {formatPrice(product.sale_price)}
              </span>
              <span className="product-card__price product-card__price--original">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="product-card__price">{formatPrice(product.price)}</span>
          )}
        </div>

        {Array.isArray(product.filters) && product.filters.length > 0 && (
          <div className="product-card__sizes">
            {product.filters
              .filter((f) => f.filter_key === 'size')
              .map((f) => f.filter_value)
              .filter(Boolean)
              .join(', ')
              .trim() ? (
              <>
                <span className="product-card__sizes-label">Sizes:</span>{' '}
                <span className="product-card__sizes-values">
                  {product.filters
                    .filter((f) => f.filter_key === 'size')
                    .map((f) => f.filter_value)
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </>
            ) : null}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
