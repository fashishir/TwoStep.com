import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { productsAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import './ProductDetail.scss';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productsAPI.getBySlug(slug);
        if (response.data.success) {
          setProduct(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
  }, [product]);

  if (loading) {
    return <div className="loading" />;
  }

  if (!product) {
    return (
      <div className="product-detail__not-found">
        <h2>Product Not Found</h2>
        <Link to="/products" className="btn btn--primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const sizes = product.filters?.filter((f) => f.filter_key === 'size') || [];
  const colors = product.filters?.filter((f) => f.filter_key === 'color') || [];
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      alert('Please select a size');
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      alert('Please select a color');
      return;
    }
    addItem(product, quantity, selectedSize, selectedColor);
  };

  return (
    <div className="product-detail">
      <div className="container">
        <nav className="product-detail__breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category_slug}`}>{product.category_name}</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-detail__layout">
          <div className="product-detail__gallery">
            <div className="product-detail__thumbnails">
              {product.images?.map((image, index) => (
                <button
                  key={image.id}
                  className={`product-detail__thumbnail ${selectedImage === index ? 'product-detail__thumbnail--active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image.image_url} alt={image.alt_text || product.name} />
                </button>
              ))}
            </div>

            <div className="product-detail__main-image">
              {product.images?.[selectedImage] ? (
                <img
                  src={product.images[selectedImage].image_url}
                  alt={product.images[selectedImage].alt_text || product.name}
                />
              ) : (
                <div className="product-detail__placeholder">No Image</div>
              )}
            </div>
          </div>

          <div className="product-detail__info">
            <h1 className="product-detail__name">{product.name}</h1>

            <div className="product-detail__pricing">
              {hasDiscount ? (
                <>
                  <span className="product-detail__price product-detail__price--sale">
                    {formatPrice(product.sale_price)}
                  </span>
                  <span className="product-detail__price product-detail__price--original">
                    {formatPrice(product.price)}
                  </span>
                  <span className="product-detail__discount">-{discountPercentage}%</span>
                </>
              ) : (
                <span className="product-detail__price">{formatPrice(product.price)}</span>
              )}
            </div>

            {product.sku && (
              <p className="product-detail__sku">SKU: {product.sku}</p>
            )}

            {colors.length > 0 && (
              <div className="product-detail__option">
                <h3 className="product-detail__option-title">
                  Color: {selectedColor || 'Select'}
                </h3>
                <div className="product-detail__colors">
                  {colors.map((filter) => (
                    <button
                      key={filter.id}
                      className={`product-detail__color ${selectedColor === filter.filter_value ? 'product-detail__color--active' : ''}`}
                      onClick={() => setSelectedColor(filter.filter_value)}
                    >
                      {filter.filter_value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="product-detail__option">
                <h3 className="product-detail__option-title">
                  Size: {selectedSize || 'Select'}
                </h3>
                <div className="product-detail__sizes">
                  {sizes.map((filter) => (
                    <button
                      key={filter.id}
                      className={`product-detail__size ${selectedSize === filter.filter_value ? 'product-detail__size--active' : ''}`}
                      onClick={() => setSelectedSize(filter.filter_value)}
                    >
                      {filter.filter_value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="product-detail__quantity">
              <h3 className="product-detail__option-title">Quantity</h3>
              <div className="product-detail__quantity-control">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            <button
              className="btn btn--primary btn--full product-detail__add-btn"
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
            >
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Bag'}
            </button>

            <div className="product-detail__description">
              <h3 className="product-detail__option-title">Description</h3>
              <p>{product.description || 'No description available.'}</p>
            </div>

            <div className="product-detail__features">
              <div className="product-detail__feature">
                <strong>Free Shipping</strong>
                <span>On orders over ৳8,000</span>
              </div>
              <div className="product-detail__feature">
                <strong>Cash on Delivery</strong>
                <span>Pay when you receive</span>
              </div>
              <div className="product-detail__feature">
                <strong>Easy Returns</strong>
                <span>30-day return policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
