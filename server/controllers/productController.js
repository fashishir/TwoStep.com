const pool = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, minPrice, maxPrice, search, sort, filters } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND (c.slug = $${paramIndex} OR c.id IN (SELECT id FROM categories WHERE parent_id = (SELECT id FROM categories WHERE slug = $${paramIndex})))`;
      params.push(category);
      paramIndex++;
    }

    if (minPrice) {
      query += ` AND p.price >= $${paramIndex}`;
      params.push(minPrice);
      paramIndex++;
    }

    if (maxPrice) {
      query += ` AND p.price <= $${paramIndex}`;
      params.push(maxPrice);
      paramIndex++;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (filters) {
      const filterPairs = JSON.parse(filters);
      filterPairs.forEach(({ key, value }) => {
        query += ` AND p.id IN (SELECT product_id FROM product_filters WHERE filter_key = $${paramIndex} AND filter_value = $${paramIndex + 1})`;
        params.push(key, value);
        paramIndex += 2;
      });
    }

    const countQuery = query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    switch (sort) {
      case 'price_asc':
        query += ' ORDER BY p.price ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY p.price DESC';
        break;
      case 'newest':
        query += ' ORDER BY p.created_at DESC';
        break;
      case 'name':
        query += ' ORDER BY p.name ASC';
        break;
      default:
        query += ' ORDER BY p.created_at DESC';
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const products = result.rows;
    if (products.length > 0) {
      const productIds = products.map((p) => p.id);

      const imagesResult = await pool.query(
        `SELECT * FROM product_images WHERE product_id = ANY($1) ORDER BY sort_order, is_primary DESC`,
        [productIds]
      );
      const imagesByProduct = {};
      for (const img of imagesResult.rows) {
        if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
        imagesByProduct[img.product_id].push(img);
      }

      const filtersResult = await pool.query(
        `SELECT id, product_id, filter_key, filter_value
         FROM product_filters
         WHERE product_id = ANY($1)
         ORDER BY product_id, filter_key, filter_value`,
        [productIds]
      );
      const filtersByProduct = {};
      for (const f of filtersResult.rows) {
        if (!filtersByProduct[f.product_id]) filtersByProduct[f.product_id] = [];
        filtersByProduct[f.product_id].push({
          id: f.id,
          filter_key: f.filter_key,
          filter_value: f.filter_value,
        });
      }

      for (const product of products) {
        product.images = imagesByProduct[product.id] || [];
        product.filters = filtersByProduct[product.id] || [];
      }
    }

    paginatedResponse(res, products, total, page, limit);
  } catch (error) {
    console.error('Get products error:', error);
    errorResponse(res, 'Failed to fetch products', 500);
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = $1 AND p.is_active = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Product not found', 404);
    }

    const product = result.rows[0];

    const imagesResult = await pool.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order, is_primary DESC',
      [product.id]
    );

    const filtersResult = await pool.query(
      'SELECT * FROM product_filters WHERE product_id = $1',
      [product.id]
    );

    successResponse(res, {
      ...product,
      images: imagesResult.rows,
      filters: filtersResult.rows,
    });
  } catch (error) {
    console.error('Get product error:', error);
    errorResponse(res, 'Failed to fetch product', 500);
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, salePrice, sku, stockQuantity, categoryId, isFeatured, filters } = req.body;

    if (!name || !price || !categoryId) {
      return errorResponse(res, 'Name, price, and category are required', 400);
    }

    let parsedFilters = filters;
    if (typeof filters === 'string') {
      try {
        parsedFilters = JSON.parse(filters);
      } catch (e) {
        parsedFilters = [];
      }
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await pool.query(
      `INSERT INTO products (name, slug, description, price, sale_price, sku, stock_quantity, category_id, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, slug, description || null, parseFloat(price), salePrice ? parseFloat(salePrice) : null, sku || null, parseInt(stockQuantity) || 0, parseInt(categoryId), isFeatured === 'true' || isFeatured === true]
    );

    const product = result.rows[0];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `/uploads/products/${file.filename}`;
        await pool.query(
          `INSERT INTO product_images (product_id, image_url, public_id, alt_text, is_primary, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [product.id, imageUrl, file.filename, name, i === 0, i]
        );
      }
    }

    if (parsedFilters && Array.isArray(parsedFilters)) {
      for (const filter of parsedFilters) {
        if (!filter?.key || filter?.value === undefined || filter?.value === null) continue;
        await pool.query(
          'INSERT INTO product_filters (product_id, filter_key, filter_value) VALUES ($1, $2, $3) ON CONFLICT (product_id, filter_key, filter_value) DO NOTHING',
          [product.id, filter.key, String(filter.value)]
        );
      }
    }

    const images = await pool.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order',
      [product.id]
    );

    successResponse(res, { ...product, images: images.rows }, 'Product created', 201);
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === '23505') {
      return errorResponse(res, 'Product with this name or SKU already exists', 400);
    }
    errorResponse(res, 'Failed to create product', 500);
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, salePrice, sku, stockQuantity, categoryId, isFeatured, is_active, filters, removedImageIds } = req.body;

    let parsedFilters = filters;
    if (typeof filters === 'string') {
      try {
        parsedFilters = JSON.parse(filters);
      } catch (e) {
        parsedFilters = [];
      }
    }

    const existing = await pool.query('SELECT id, name, slug FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return errorResponse(res, 'Product not found', 404);
    }

    const currentProduct = existing.rows[0];
    const updatedName = (name && name.trim()) || currentProduct.name;

    let slug;
    if (name && name.trim()) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const result = await pool.query(
      `UPDATE products 
       SET name = $1, slug = COALESCE($2, slug), description = COALESCE($3, description),
           price = COALESCE($4, price), sale_price = COALESCE($5, sale_price), sku = COALESCE($6, sku),
           stock_quantity = COALESCE($7, stock_quantity), category_id = COALESCE($8, category_id),
           is_featured = COALESCE($9, is_featured), is_active = COALESCE($10, is_active), updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [updatedName, slug || null, description || null, price ? parseFloat(price) : null, salePrice ? parseFloat(salePrice) : null, sku || null, stockQuantity ? parseInt(stockQuantity) : null, categoryId ? parseInt(categoryId) : null, isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : null, is_active !== undefined ? (is_active === 'true' || is_active === true) : null, id]
    );

    const product = result.rows[0];

    // Handle image removals selectively instead of deleting all images
    if (removedImageIds) {
      let idsToRemove = [];
      try {
        idsToRemove = typeof removedImageIds === 'string' ? JSON.parse(removedImageIds) : removedImageIds;
      } catch (e) {
        console.error('Failed to parse removedImageIds:', e);
      }
      if (Array.isArray(idsToRemove) && idsToRemove.length > 0) {
        await pool.query(
          'DELETE FROM product_images WHERE product_id = $1 AND id = ANY($2)',
          [id, idsToRemove]
        );
      }
    }

    // Add new images without deleting existing ones
    if (req.files && req.files.length > 0) {
      // Get current max sort order
      const maxOrderResult = await pool.query(
        'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM product_images WHERE product_id = $1',
        [id]
      );
      let sortOrder = parseInt(maxOrderResult.rows[0].max_order) + 1;

      // Check if any existing image is marked as primary
      const primaryCheck = await pool.query(
        'SELECT COUNT(*) as cnt FROM product_images WHERE product_id = $1 AND is_primary = true',
        [id]
      );
      const hasExistingPrimary = parseInt(primaryCheck.rows[0].cnt) > 0;

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `/uploads/products/${file.filename}`;
        await pool.query(
          `INSERT INTO product_images (product_id, image_url, public_id, alt_text, is_primary, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, imageUrl, file.filename, updatedName, !hasExistingPrimary && i === 0, sortOrder + i]
        );
      }
    }

    if (parsedFilters && Array.isArray(parsedFilters)) {
      await pool.query('DELETE FROM product_filters WHERE product_id = $1', [id]);
      for (const filter of parsedFilters) {
        if (!filter?.key || filter?.value === undefined || filter?.value === null) continue;
        await pool.query(
          'INSERT INTO product_filters (product_id, filter_key, filter_value) VALUES ($1, $2, $3) ON CONFLICT (product_id, filter_key, filter_value) DO NOTHING',
          [id, filter.key, String(filter.value)]
        );
      }
    }

    const images = await pool.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order',
      [id]
    );

    successResponse(res, { ...product, images: images.rows }, 'Product updated');
  } catch (error) {
    console.error('Update product error:', error);
    errorResponse(res, 'Failed to update product', 500);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return errorResponse(res, 'Product not found', 404);
    }

    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    successResponse(res, null, 'Product deleted');
  } catch (error) {
    console.error('Delete product error:', error);
    errorResponse(res, 'Failed to delete product', 500);
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true AND p.is_featured = true
       ORDER BY p.created_at DESC
       LIMIT 8`
    );

    const products = result.rows;

    const productIds = products.map((p) => p.id);

    const imagesResult = await pool.query(
      `SELECT * FROM product_images WHERE product_id = ANY($1) ORDER BY sort_order, is_primary DESC`,
      [productIds]
    );
    const imagesByProduct = {};
    for (const img of imagesResult.rows) {
      if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
      imagesByProduct[img.product_id].push(img);
    }

    const filtersResult = await pool.query(
      `SELECT id, product_id, filter_key, filter_value
       FROM product_filters
       WHERE product_id = ANY($1)
       ORDER BY product_id, filter_key, filter_value`,
      [productIds]
    );
    const filtersByProduct = {};
    for (const f of filtersResult.rows) {
      if (!filtersByProduct[f.product_id]) filtersByProduct[f.product_id] = [];
      filtersByProduct[f.product_id].push({
        id: f.id,
        filter_key: f.filter_key,
        filter_value: f.filter_value,
      });
    }

    for (const product of products) {
      product.images = imagesByProduct[product.id] || [];
      product.filters = filtersByProduct[product.id] || [];
    }

    successResponse(res, products);
  } catch (error) {
    console.error('Get featured products error:', error);
    errorResponse(res, 'Failed to fetch featured products', 500);
  }
};

const getProductFilters = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT filter_key, filter_value
       FROM product_filters
       ORDER BY filter_key, filter_value`
    );

    const filters = {};
    result.rows.forEach(({ filter_key, filter_value }) => {
      if (!filters[filter_key]) {
        filters[filter_key] = [];
      }
      filters[filter_key].push(filter_value);
    });

    successResponse(res, filters);
  } catch (error) {
    console.error('Get product filters error:', error);
    errorResponse(res, 'Failed to fetch filters', 500);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductFilters,
};
