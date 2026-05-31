const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return errorResponse(res, 'All fields are required', 400);
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return errorResponse(res, 'Email already registered', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, uuid, email, first_name, last_name, phone, role, created_at`,
      [email, passwordHash, firstName, lastName, phone]
    );

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    successResponse(res, {
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at,
      },
    }, 'Registration successful', 201);
  } catch (error) {
    console.error('Register error:', error);
    errorResponse(res, 'Registration failed', 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    const result = await pool.query(
      'SELECT id, uuid, email, password_hash, first_name, last_name, phone, role, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return errorResponse(res, 'Account is deactivated', 403);
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    successResponse(res, {
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
      },
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 'Login failed', 500);
  }
};

const logout = async (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  successResponse(res, null, 'Logged out successfully');
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return errorResponse(res, 'No refresh token', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'User not found', 401);
    }

    const user = result.rows[0];
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    successResponse(res, { user: { id: user.id, email: user.email, role: user.role } }, 'Token refreshed');
  } catch (error) {
    console.error('Refresh token error:', error);
    errorResponse(res, 'Invalid refresh token', 403);
  }
};

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, uuid, email, first_name, last_name, phone, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const user = result.rows[0];
    successResponse(res, {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Get me error:', error);
    errorResponse(res, 'Failed to get user data', 500);
  }
};

module.exports = { register, login, logout, refreshToken, getMe };
