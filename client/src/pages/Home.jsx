import { useState, useEffect } from 'react';
import HeroBanner from '../components/home/HeroBanner';
import ProductCard from '../components/products/ProductCard';
import { productsAPI } from '../services/api';
import './Home.scss';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await productsAPI.getFeatured();
        if (response.data.success) {
          setFeaturedProducts(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="home">
      <HeroBanner
        title="New Arrivals"
        subtitle="Just Dropped"
        ctaText="Shop Now"
        ctaLink="/products?sort=newest"
         image="https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1600&q=80"
      />

      <section className="home__section">
        <div className="container">
          <h2 className="heading heading--md home__section-title">Trending This Season</h2>
          {loading ? (
            <div className="loading" />
          ) : (
            <div className="home__products-grid">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="home__categories">
        <div className="container">
          <h2 className="heading heading--md home__section-title">Shop by Category</h2>
          <div className="home__categories-grid">
            <a href="/products?category=men" className="home__category-card">
              <div
                className="home__category-image"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80)' }}
              />
              <span className="home__category-name">Men</span>
            </a>
            <a href="/products?category=women" className="home__category-card">
              <div
                className="home__category-image"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80)' }}
              />
              <span className="home__category-name">Women</span>
            </a>
            <a href="/products?category=kids" className="home__category-card">
              <div
                className="home__category-image"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80)' }}
              />
              <span className="home__category-name">Kids</span>
            </a>
            <a href="/products?category=sports" className="home__category-card">
              <div
                className="home__category-image"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1461896836934-bd45ea8e2843?w=800&q=80)' }}
              />
              <span className="home__category-name">Sports</span>
            </a>
          </div>
        </div>
      </section>

      <HeroBanner
        title="Performance Gear"
        subtitle="Engineered for Athletes"
        ctaText="Shop Sports"
        ctaLink="/products?category=sports"
        image="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&q=80"
      />

      <section className="home__promo">
        <div className="container">
          <div className="home__promo-grid">
            <div className="home__promo-card">
              <h3>Free Shipping</h3>
              <p>On orders over ৳8,000</p>
            </div>
            <div className="home__promo-card">
              <h3>Cash on Delivery</h3>
              <p>Pay when you receive</p>
            </div>
            <div className="home__promo-card">
              <h3>Easy Returns</h3>
              <p>30-day return policy</p>
            </div>
            <div className="home__promo-card">
              <h3>Secure Checkout</h3>
              <p>100% secure payment</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
