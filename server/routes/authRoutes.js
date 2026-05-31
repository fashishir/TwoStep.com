const express = require('express');
const router = express.Router();
const { register, login, logout, refreshToken, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticateToken, getMe);

module.exports = router;
