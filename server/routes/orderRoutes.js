const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, updateOrderStatus, updateOrderShipping, updatePaymentStatus, getOrderStats, getOrderByTrackingId, getOrderHistory } = require('../controllers/orderController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/', optionalAuth, createOrder);
router.get('/stats', authenticateToken, authorize('admin', 'moderator'), getOrderStats);
router.get('/track/:trackingId', getOrderByTrackingId);
router.get('/', authenticateToken, getOrders);
router.get('/:id/history', authenticateToken, getOrderHistory);
router.get('/:id', authenticateToken, getOrderById);
router.put('/:id/status', authenticateToken, authorize('admin', 'moderator'), updateOrderStatus);
router.put('/:id/payment', authenticateToken, authorize('admin', 'moderator'), updatePaymentStatus);
router.put('/:id/shipping', authenticateToken, authorize('admin', 'moderator'), updateOrderShipping);

module.exports = router;
