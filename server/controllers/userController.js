const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, uuid, email, first_name, last_name, phone, role, is_active, created_at FROM users';
    const params = [];
    let paramIndex = 1;
    const conditions = [];

    if (search) {
      conditions.push(`(email ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      conditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const countQuery = `SELECT COUNT(*) FROM users${conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    paginatedResponse(res, result.rows, total, page, limit);
  } catch (error) {
    console.error('Get users error:', error);
    errorResponse(res, 'Failed to fetch users', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, uuid, email, first_name, last_name, phone, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    errorResponse(res, 'Failed to fetch user', 500);
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'moderator', 'customer'];
    if (!validRoles.includes(role)) {
      return errorResponse(res, 'Invalid role', 400);
    }

    if (req.user.id === parseInt(id)) {
      return errorResponse(res, 'Cannot change your own role', 400);
    }

    const existing = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, uuid, email, first_name, last_name, phone, role, is_active',
      [role, id]
    );

    successResponse(res, result.rows[0], 'User role updated');
  } catch (error) {
    console.error('Update user role error:', error);
    errorResponse(res, 'Failed to update user role', 500);
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (req.user.id === parseInt(id)) {
      return errorResponse(res, 'Cannot deactivate your own account', 400);
    }

    const existing = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const result = await pool.query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, uuid, email, first_name, last_name, phone, role, is_active',
      [isActive, id]
    );

    successResponse(res, result.rows[0], 'User status updated');
  } catch (error) {
    console.error('Update user status error:', error);
    errorResponse(res, 'Failed to update user status', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === parseInt(id)) {
      return errorResponse(res, 'Cannot delete your own account', 400);
    }

    const existing = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    successResponse(res, null, 'User deleted');
  } catch (error) {
    console.error('Delete user error:', error);
    errorResponse(res, 'Failed to delete user', 500);
  }
};

const getUserStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
        COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderators,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN 1 END) as new_this_month
      FROM users
    `);

    successResponse(res, stats.rows[0]);
  } catch (error) {
    console.error('Get user stats error:', error);
    errorResponse(res, 'Failed to fetch user stats', 500);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getUserStats,
};
