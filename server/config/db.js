const { Pool } = require('pg');

// Railway provides DATABASE_URL; fall back to individual env vars for local dev
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'twostep',
      password: process.env.DB_PASSWORD || 'admin',
      port: process.env.DB_PORT || 5432,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

// Log idle-client errors but do not crash the process. node-postgres discards
// the broken client and creates a fresh one on the next checkout, so a single
// transient connection failure should not take down the whole server.
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

module.exports = pool;
