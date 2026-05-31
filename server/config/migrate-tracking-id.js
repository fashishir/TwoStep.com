const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'twostep',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateTrackingId() {
  const seg = (len) => {
    let r = '';
    const bytes = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) r += CHARS[bytes[i] % CHARS.length];
    return r;
  };
  return `ORD-${seg(4)}-${seg(4)}`;
}

async function migrate() {
  const client = await pool.connect();
  try {
    const colCheck = await client.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tracking_id')"
    );

    if (!colCheck.rows[0].exists) {
      console.log('Adding tracking_id column to orders table...');
      await client.query('ALTER TABLE orders ADD COLUMN tracking_id VARCHAR(20)');

      console.log('Generating tracking IDs for existing orders...');
      const orders = await client.query('SELECT id FROM orders ORDER BY id');
      for (const order of orders.rows) {
        let trackingId;
        let isUnique = false;
        while (!isUnique) {
          trackingId = generateTrackingId();
          const check = await client.query('SELECT id FROM orders WHERE tracking_id = $1', [trackingId]);
          isUnique = check.rows.length === 0;
        }
        await client.query('UPDATE orders SET tracking_id = $1 WHERE id = $2', [trackingId, order.id]);
        console.log(`  Order #${order.id} -> ${trackingId}`);
      }

      await client.query('ALTER TABLE orders ALTER COLUMN tracking_id SET NOT NULL');
      await client.query('ALTER TABLE orders ADD CONSTRAINT orders_tracking_id_unique UNIQUE (tracking_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON orders(tracking_id)');

      console.log('Migration complete!');
    } else {
      console.log('tracking_id column already exists. Skipping.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
