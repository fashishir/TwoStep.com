const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUserRole, updateUserStatus, deleteUser, getUserStats } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', authenticateToken, authorize('admin', 'moderator'), getUsers);
router.get('/stats', authenticateToken, authorize('admin'), getUserStats);
router.get('/:id', authenticateToken, authorize('admin', 'moderator'), getUserById);
router.put('/:id/role', authenticateToken, authorize('admin'), updateUserRole);
router.put('/:id/status', authenticateToken, authorize('admin'), updateUserStatus);
router.delete('/:id', authenticateToken, authorize('admin'), deleteUser);

module.exports = router;
