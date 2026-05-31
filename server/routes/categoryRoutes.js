const express = require('express');
const router = express.Router();
const { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { categoryUpload } = require('../middleware/upload');

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', authenticateToken, authorize('admin', 'moderator'), categoryUpload.single('image'), createCategory);
router.put('/:id', authenticateToken, authorize('admin', 'moderator'), categoryUpload.single('image'), updateCategory);
router.delete('/:id', authenticateToken, authorize('admin'), deleteCategory);

module.exports = router;
