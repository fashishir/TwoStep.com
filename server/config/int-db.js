const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { ADMIN_USER, CATEGORIES, SUBCATEGORIES, PRODUCTS } = require('./seed');

const DB_NAME = process.env.DB_NAME || 'twostep';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'admin';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

const RESET = process.argv.includes('--reset');

function getTargetPoolConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    };
  }
  return {
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: DB_PORT,
  };
}

async function createDatabaseIfNotExists() {
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL set — skipping local database creation (managed Postgres).');
    return;
  }
  const adminPool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: 'postgres',
    password: DB_PASSWORD,
    port: DB_PORT,
  });

  try {
    const result = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );

    if (result.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`Database "${DB_NAME}" created successfully.`);
    } else {
      console.log(`Database "${DB_NAME}" already exists.`);
    }
  } finally {
    await adminPool.end();
  }
}

async function runSchema(client) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await client.query(schema);
  console.log('Schema applied successfully.');
}

async function clearTables(client) {
  if (!RESET) return;

  console.log('Resetting: clearing all tables...');
  await client.query('DELETE FROM order_items');
  await client.query('DELETE FROM orders');
  await client.query('DELETE FROM product_filters');
  await client.query('DELETE FROM product_images');
  await client.query('DELETE FROM products');
  await client.query('DELETE FROM categories');
  await client.query('DELETE FROM users');

  await client.query("ALTER SEQUENCE users_id_seq RESTART WITH 1");
  await client.query("ALTER SEQUENCE categories_id_seq RESTART WITH 1");
  await client.query("ALTER SEQUENCE products_id_seq RESTART WITH 1");
  await client.query("ALTER SEQUENCE product_images_id_seq RESTART WITH 1");
  await client.query("ALTER SEQUENCE product_filters_id_seq RESTART WITH 1");
  await client.query("ALTER SEQUENCE orders_id_seq RESTART WITH 1");
  await client.query("ALTER SEQUENCE order_items_id_seq RESTART WITH 1");

  console.log('All tables cleared and sequences reset.');
}

async function seedAdminUser(client) {
  const existing = await client.query('SELECT id FROM users WHERE email = $1', [ADMIN_USER.email]);
  if (existing.rows.length > 0) {
    console.log(`Admin user "${ADMIN_USER.email}" already exists — skipping.`);
    return existing.rows[0].id;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(ADMIN_USER.password, salt);

  const result = await client.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [ADMIN_USER.email, passwordHash, ADMIN_USER.firstName, ADMIN_USER.lastName, ADMIN_USER.phone, ADMIN_USER.role]
  );

  console.log(`Admin user created: ${ADMIN_USER.email} / ${ADMIN_USER.password}`);
  return result.rows[0].id;
}

async function seedCategories(client) {
  const categoryMap = {};

  for (const cat of CATEGORIES) {
    const existing = await client.query('SELECT id FROM categories WHERE slug = $1', [cat.slug]);
    if (existing.rows.length > 0) {
      categoryMap[cat.slug] = existing.rows[0].id;
      continue;
    }

    const result = await client.query(
      `INSERT INTO categories (name, slug, description, image_url, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [cat.name, cat.slug, cat.description, cat.imageUrl, cat.sortOrder]
    );
    categoryMap[cat.slug] = result.rows[0].id;
  }

  console.log(`Seeded ${Object.keys(categoryMap).length} categories.`);
  return categoryMap;
}

async function seedProducts(client, categoryMap) {
  let productCount = 0;

  for (const product of PRODUCTS) {
    const existing = await client.query('SELECT id FROM products WHERE sku = $1', [product.sku]);
    if (existing.rows.length > 0) {
      continue;
    }

    const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const categoryId = categoryMap[product.categorySlug];

    const result = await client.query(
      `INSERT INTO products (name, slug, description, price, sale_price, sku, stock_quantity, is_featured, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [product.name, slug, product.description, product.price, product.salePrice, product.sku, product.stockQuantity, product.isFeatured, categoryId]
    );

    const productId = result.rows[0].id;

    for (let i = 0; i < product.images.length; i++) {
      const img = product.images[i];
      await client.query(
        `INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [productId, img.url, img.alt, img.isPrimary || false, i]
      );
    }

    for (const filter of product.filters) {
      await client.query(
        `INSERT INTO product_filters (product_id, filter_key, filter_value)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, filter_key, filter_value) DO NOTHING`,
        [productId, filter.key, filter.value]
      );
    }

    productCount++;
  }

  console.log(`Seeded ${productCount} new products (${PRODUCTS.length} total in seed data).`);
}

async function initDB() {
  console.log('');
  console.log('========================================');
  console.log('  Two-step Database Initializer');
  console.log('========================================');
  console.log('');

  try {
    // Step 1: Create database if it doesn't exist
    await createDatabaseIfNotExists();

    // Step 2: Connect to the target database
    const pool = new Pool(getTargetPoolConfig());

    const client = await pool.connect();

    try {
      // Step 3: Run schema
      await runSchema(client);

      // Step 4: Clear tables if --reset flag
      await clearTables(client);

      // Step 5: Seed data
      console.log('');
      console.log('Seeding data...');
      console.log('---');

      await seedAdminUser(client);
      const categoryMap = await seedCategories(client);
      await seedProducts(client, categoryMap);

      console.log('---');
      console.log('');
      console.log('========================================');
      console.log('  Database initialization complete!');
      console.log('========================================');
      console.log('');
      console.log('  Admin login: admin@twostep.com / admin123');
      console.log('  Run "npm run dev" to start the server.');
      console.log('');

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('');
    console.error('ERROR: Database initialization failed.');
    console.error('');
    console.error(error.message);
    console.error('');
    process.exit(1);
  }
}

initDB();
