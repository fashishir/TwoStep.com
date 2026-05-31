import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { categoriesAPI } from '../../services/api';
import { FiSearch, FiHeart, FiShoppingBag, FiUser, FiMenu, FiX } from 'react-icons/fi';
import './Navbar.scss';

const Navbar = () => {
  const [categories, setCategories] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getAll();
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setActiveCategory(null);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const mainCategories = [
    { name: 'Men', slug: 'men' },
    { name: 'Women', slug: 'women' },
    { name: 'Kids', slug: 'kids' },
    { name: 'Sports', slug: 'sports' },
    { name: 'Sale', slug: 'sale', isSale: true },
  ];

  return (
    <header className="navbar">
      <nav className="navbar__main">
        <div className="navbar__container">
          <div className="navbar__left">
            <button
              className="navbar__menu-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>

            <Link to="/" className="navbar__logo">
              <span className="navbar__logo-text">TWOSTEP</span>
            </Link>
          </div>

          <div className="navbar__center">
            {mainCategories.map((category) => (
              <div
                key={category.slug}
                className="navbar__category"
                onMouseEnter={() => setActiveCategory(category.slug)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <Link
                  to={`/products?category=${category.slug}`}
                  className={`navbar__category-link ${category.isSale ? 'navbar__category-link--sale' : ''}`}
                >
                  {category.name}
                </Link>
              </div>
            ))}
          </div>

          <div className="navbar__right">
            <form className="navbar__search" onSubmit={handleSearch}>
              <FiSearch className="navbar__search-icon" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="navbar__search-input"
              />
            </form>

            <div className="navbar__actions">
              {isAuthenticated ? (
                <div className="navbar__user-menu">
                  <Link to="/account" className="navbar__action-btn" aria-label="My Account">
                    <FiUser size={22} />
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="navbar__action-btn navbar__admin-link">
                      Admin
                    </Link>
                  )}
                </div>
              ) : (
                <Link to="/login" className="navbar__action-btn" aria-label="Login">
                  <FiUser size={22} />
                </Link>
              )}

              <button className="navbar__action-btn" aria-label="Wishlist">
                <FiHeart size={22} />
              </button>

              <button className="navbar__action-btn" onClick={toggleCart} aria-label="Cart">
                <FiShoppingBag size={22} />
                {totalItems > 0 && (
                  <span className="navbar__cart-badge">{totalItems}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="navbar__mobile-menu">
          <div className="navbar__mobile-search">
            <form onSubmit={handleSearch}>
              <FiSearch />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="navbar__mobile-categories">
            {mainCategories.map((category) => (
              <Link
                key={category.slug}
                to={`/products?category=${category.slug}`}
                className={`navbar__mobile-category ${category.isSale ? 'navbar__mobile-category--sale' : ''}`}
              >
                {category.name}
              </Link>
            ))}
          </div>

          <div className="navbar__mobile-links">
            <Link to="/track-order" className="navbar__mobile-link">Track Order</Link>
            {isAuthenticated ? (
              <>
                <Link to="/account" className="navbar__mobile-link">My Account</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="navbar__mobile-link">Admin Panel</Link>
                )}
                <button onClick={handleLogout} className="navbar__mobile-link">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar__mobile-link">Login</Link>
                <Link to="/register" className="navbar__mobile-link">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
