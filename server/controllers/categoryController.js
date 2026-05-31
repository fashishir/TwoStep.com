const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = true) as product_count
       FROM categories c
       WHERE c.is_active = true
       ORDER BY c.sort_order, c.name`
    );

    const categories = result.rows;
    const rootCategories = categories.filter(c => !c.parent_id);
    const subCategories = categories.filter(c => c.parent_id);

    const categoriesWithChildren = rootCategories.map(cat => ({
      ...cat,
      children: subCategories.filter(sub => sub.parent_id === cat.id),
    }));

    successResponse(res, categoriesWithChildren);
  } catch (error) {
    console.error('Get categories error:', error);
    errorResponse(res, 'Failed to fetch categories', 500);
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return errorResponse(res, 'Category not found', 404);
    }

    successResponse(res, result.rows[0]);
  } catch (error) {
    console.error('Get category error:', error);
    errorResponse(res, 'Failed to fetch category', 500);
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, parentId, sortOrder } = req.body;

    if (!name) {
      return errorResponse(res, 'Category name is required', 400);
    }

    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existingSlug = await pool.query('SELECT id FROM categories WHERE slug = $1', [slug]);
    if (existingSlug.rows.length > 0) {
      const timestamp = Date.now();
      slug = `${slug}-${timestamp}`;
    }

    let imageUrl = req.body.imageUrl || null;
    if (req.file) {
      imageUrl = `/uploads/categories/${req.file.filename}`;
    }

    const result = await pool.query(
      `INSERT INTO categories (name, slug, description, parent_id, image_url, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, slug, description, parentId || null, imageUrl, sortOrder || 0]
    );

    successResponse(res, result.rows[0], 'Category created', 201);
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === '23505') {
      return errorResponse(res, 'Category with this name already exists', 400);
    }
    errorResponse(res, 'Failed to create category', 500);
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentId, sortOrder, isActive } = req.body;

    const existing = await pool.query('SELECT id FROM categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return errorResponse(res, 'Category not found', 404);
    }

    let slug;
    if (name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existingSlug = await pool.query('SELECT id FROM categories WHERE slug = $1 AND id != $2', [slug, id]);
      if (existingSlug.rows.length > 0) {
        const timestamp = Date.now();
        slug = `${slug}-${timestamp}`;
      }
    }

    let imageUrl = req.body.imageUrl || null;
    if (req.file) {
      imageUrl = `/uploads/categories/${req.file.filename}`;
    }

    const result = await pool.query(
      `UPDATE categories 
       SET name = COALESCE($1, name), slug = COALESCE($2, slug), description = COALESCE($3, description),
           parent_id = COALESCE($4, parent_id), image_url = COALESCE($5, image_url),
           sort_order = COALESCE($6, sort_order), is_active = COALESCE($7, is_active), updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, slug, description, parentId, imageUrl, sortOrder, isActive, id]
    );

    successResponse(res, result.rows[0], 'Category updated');
  } catch (error) {
    console.error('Update category error:', error);
    errorResponse(res, 'Failed to update category', 500);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT id FROM categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return errorResponse(res, 'Category not found', 404);
    }

    const productsCount = await pool.query(
      'SELECT COUNT(*) FROM products WHERE category_id = $1',
      [id]
    );

    if (parseInt(productsCount.rows[0].count) > 0) {
      return errorResponse(res, 'Cannot delete category with products', 400);
    }

    await pool.query('UPDATE categories SET parent_id = NULL WHERE parent_id = $1', [id]);
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);

    successResponse(res, null, 'Category deleted');
  } catch (error) {
    console.error('Delete category error:', error);
    errorResponse(res, 'Failed to delete category', 500);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
