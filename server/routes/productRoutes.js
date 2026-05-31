const express = require('express');
const router = express.Router();
const { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, getFeaturedProducts, getProductFilters } = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/filters', getProductFilters);
router.get('/:slug', getProductBySlug);

router.post('/', authenticateToken, authorize('admin', 'moderator'), upload.array('images', 5), createProduct);
router.put('/:id', authenticateToken, authorize('admin', 'moderator'), upload.array('images', 5), updateProduct);
router.delete('/:id', authenticateToken, authorize('admin'), deleteProduct);

module.exports = router;
