/**
 * src/config/db.js
 * Read-only PostgreSQL connection pool.
 * The agent EXCLUSIVELY uses this pool — the analyst_readonly role
 * physically prevents any non-SELECT operations at the DB level.
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const readonlyPool = new Pool({
  connectionString: process.env.READONLY_DATABASE_URL,
  ssl: process.env.READONLY_DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 10_000, // Kill any query taking longer than 10 seconds
});

// Verify connection on startup
readonlyPool.connect((err, _client, done) => {
  if (err) {
    console.error('❌ Read-only DB connection failed:', err.message);
    console.error('   Check READONLY_DATABASE_URL in .env');
  } else {
    console.log('✅ Read-only DB pool connected');
    done();
  }
});

export default readonlyPool;
