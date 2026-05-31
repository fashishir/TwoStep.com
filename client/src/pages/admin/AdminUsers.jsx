import { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';
import './AdminPages.scss';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [pagination.page]);

  const fetchUsers = async () => {
    try {
      const params = { page: pagination.page, limit: 10 };
      if (search) params.search = search;

      const response = await usersAPI.getAll(params);
      if (response.data.success) {
        setUsers(response.data.data.items);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      try {
        await usersAPI.updateRole(userId, newRole);
        fetchUsers();
      } catch (error) {
        console.error('Failed to update user role:', error);
        alert(error.response?.data?.message || 'Failed to update user role');
      }
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    const action = isActive ? 'activate' : 'deactivate';
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        await usersAPI.updateStatus(userId, isActive);
        fetchUsers();
      } catch (error) {
        console.error('Failed to update user status:', error);
        alert('Failed to update user status');
      }
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await usersAPI.delete(userId);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchUsers();
  };

  const roleColors = {
    admin: '#e4002b',
    moderator: '#3b82f6',
    customer: '#10b981',
  };

  if (loading) {
    return <div className="loading" />;
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h2>Users ({pagination.total})</h2>
        <form onSubmit={handleSearch} className="admin-page__search">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn--primary">Search</button>
        </form>
      </div>

      <div className="admin-page__table-wrapper">
        <table className="admin-page__table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="admin-page__user">
                    <div className="admin-page__avatar">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </div>
                    <span>{user.first_name} {user.last_name}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="admin-page__role-select"
                    style={{ borderColor: roleColors[user.role] }}
                  >
                    <option value="customer">Customer</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <span
                    className={`admin-page__status ${user.is_active ? 'admin-page__status--active' : 'admin-page__status--inactive'}`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="admin-page__actions">
                    <button
                      onClick={() => handleStatusChange(user.id, !user.is_active)}
                      className="admin-page__action-btn"
                      title={user.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {user.is_active ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="admin-page__action-btn admin-page__action-btn--delete"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="admin-page__pagination">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
