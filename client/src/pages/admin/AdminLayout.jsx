import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productsAPI, ordersAPI, usersAPI } from '../../services/api';
import { FiPackage, FiShoppingBag, FiUsers, FiDollarSign, FiGrid } from 'react-icons/fi';
import './AdminLayout.scss';

const AdminLayout = ({ children }) => {
  const { user, isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin && !isModerator) {
      navigate('/');
    }
  }, [isAdmin, isModerator, navigate]);

  if (!isAdmin && !isModerator) {
    return null;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <Link to="/admin" className="admin-sidebar__logo">TWOSTEP</Link>
          <span className="admin-sidebar__badge">Admin</span>
        </div>

        <nav className="admin-sidebar__nav">
          <Link to="/admin" className="admin-sidebar__link">
            <FiDollarSign size={18} />
            Dashboard
          </Link>
          <Link to="/admin/products" className="admin-sidebar__link">
            <FiPackage size={18} />
            Products
          </Link>
          <Link to="/admin/categories" className="admin-sidebar__link">
            <FiGrid size={18} />
            Categories
          </Link>
          <Link to="/admin/orders" className="admin-sidebar__link">
            <FiShoppingBag size={18} />
            Orders
          </Link>
          {isAdmin && (
            <Link to="/admin/users" className="admin-sidebar__link">
              <FiUsers size={18} />
              Users
            </Link>
          )}
        </nav>

        <div className="admin-sidebar__footer">
          <Link to="/" className="admin-sidebar__link">Back to Store</Link>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>Admin Panel</h1>
          <p>Welcome, {user?.firstName || user?.email}</p>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
