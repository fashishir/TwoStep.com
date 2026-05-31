import { useState, useEffect } from 'react';
import { productsAPI, ordersAPI, usersAPI } from '../../services/api';
import { formatPriceInt } from '../../utils/formatPrice';
import { FiPackage, FiShoppingBag, FiUsers, FiDollarSign, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import './Dashboard.scss';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [orderStats, ordersResponse] = await Promise.all([
          ordersAPI.getStats(),
          ordersAPI.getAll({ limit: 5 }),
        ]);

        if (orderStats.data.success) {
          setStats(orderStats.data.data);
        }

        if (ordersResponse.data.success) {
          setRecentOrders(ordersResponse.data.data.items);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading" />;
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatPriceInt(stats?.total_revenue || 0),
      icon: <FiDollarSign size={24} />,
      color: '#10b981',
    },
    {
      title: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: <FiShoppingBag size={24} />,
      color: '#3b82f6',
    },
    {
      title: 'Pending Orders',
      value: stats?.pending_orders || 0,
      icon: <FiAlertCircle size={24} />,
      color: '#f59e0b',
    },
    {
      title: 'Delivered Orders',
      value: stats?.delivered_orders || 0,
      icon: <FiPackage size={24} />,
      color: '#10b981',
    },
  ];

  const statusColors = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
  };

  return (
    <div className="dashboard">
      <div className="dashboard__stats">
        {statCards.map((card, index) => (
          <div key={index} className="dashboard__stat-card">
            <div className="dashboard__stat-icon" style={{ backgroundColor: card.color }}>
              {card.icon}
            </div>
            <div className="dashboard__stat-info">
              <h3>{card.title}</h3>
              <p>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard__grid">
        <div className="dashboard__card">
          <h2 className="dashboard__card-title">Recent Orders</h2>
          <div className="dashboard__table-wrapper">
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.first_name} {order.last_name}</td>
                    <td>{formatPriceInt(order.total_amount)}</td>
                    <td>
                      <span
                        className="dashboard__status"
                        style={{ backgroundColor: statusColors[order.status] }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard__card">
          <h2 className="dashboard__card-title">Order Status Overview</h2>
          <div className="dashboard__status-grid">
            <div className="dashboard__status-item">
              <span className="dashboard__status-dot" style={{ backgroundColor: '#f59e0b' }} />
              <span className="dashboard__status-label">Pending</span>
              <span className="dashboard__status-value">{stats?.pending_orders || 0}</span>
            </div>
            <div className="dashboard__status-item">
              <span className="dashboard__status-dot" style={{ backgroundColor: '#3b82f6' }} />
              <span className="dashboard__status-label">Processing</span>
              <span className="dashboard__status-value">{stats?.processing_orders || 0}</span>
            </div>
            <div className="dashboard__status-item">
              <span className="dashboard__status-dot" style={{ backgroundColor: '#8b5cf6' }} />
              <span className="dashboard__status-label">Shipped</span>
              <span className="dashboard__status-value">{stats?.shipped_orders || 0}</span>
            </div>
            <div className="dashboard__status-item">
              <span className="dashboard__status-dot" style={{ backgroundColor: '#10b981' }} />
              <span className="dashboard__status-label">Delivered</span>
              <span className="dashboard__status-value">{stats?.delivered_orders || 0}</span>
            </div>
            <div className="dashboard__status-item">
              <span className="dashboard__status-dot" style={{ backgroundColor: '#ef4444' }} />
              <span className="dashboard__status-label">Cancelled</span>
              <span className="dashboard__status-value">{stats?.cancelled_orders || 0}</span>
            </div>
          </div>

          <div className="dashboard__revenue">
            <h3>Monthly Revenue</h3>
            <p className="dashboard__revenue-value">
              {formatPriceInt(stats?.monthly_revenue || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
