import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiPackage, FiShoppingBag, FiUsers, FiDollarSign, FiGrid, FiMenu, FiX, FiHome, FiLogOut } from 'react-icons/fi';
import './AdminLayout.scss';

const AdminLayout = ({ children }) => {
  const { user, isAdmin, isModerator, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin && !isModerator) {
      navigate('/');
    }
  }, [isAdmin, isModerator, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAdmin && !isModerator) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/admin', icon: <FiDollarSign size={18} />, label: 'Dashboard' },
    { to: '/admin/products', icon: <FiPackage size={18} />, label: 'Products' },
    { to: '/admin/categories', icon: <FiGrid size={18} />, label: 'Categories' },
    { to: '/admin/orders', icon: <FiShoppingBag size={18} />, label: 'Orders' },
    ...(isAdmin ? [{ to: '/admin/users', icon: <FiUsers size={18} />, label: 'Users' }] : []),
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard';
    if (path === '/admin/products') return 'Products';
    if (path === '/admin/categories') return 'Categories';
    if (path === '/admin/orders') return 'Orders';
    if (path === '/admin/users') return 'Users';
    return 'Admin';
  };

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <div className="admin-mobile-header">
        <button
          className="admin-mobile-header__menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
        <span className="admin-mobile-header__title">{getPageTitle()}</span>
        <div className="admin-mobile-header__spacer" />
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__header">
          <Link to="/admin" className="admin-sidebar__logo" onClick={() => setSidebarOpen(false)}>
            TWOSTEP
          </Link>
          <span className="admin-sidebar__badge">Admin</span>
        </div>

        <nav className="admin-sidebar__nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`admin-sidebar__link ${location.pathname === item.to ? 'admin-sidebar__link--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <Link to="/" className="admin-sidebar__link" onClick={() => setSidebarOpen(false)}>
            <FiHome size={18} />
            <span>Back to Store</span>
          </Link>
          <button onClick={handleLogout} className="admin-sidebar__link admin-sidebar__logout">
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header__left">
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="admin-header__right">
            <div className="admin-header__user-info">
              <div className="admin-header__avatar">
                {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
              </div>
              <span className="admin-header__user">
                {user?.firstName || user?.first_name || user?.email}
              </span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
