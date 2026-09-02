/**
 * run_init.js — Initializes and seeds the database.
 * Usage: node scripts/run_init.js
 * Requires DATABASE_URL in .env (admin/superuser connection).
 */

import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false,
});

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`\n▶ Running: ${path.basename(filePath)}`);
  try {
    const result = await pool.query(sql);
    // Print any result rows (verification SELECTs)
    const rows = Array.isArray(result) ? result : [result];
    rows.forEach((r) => {
      if (r.rows && r.rows.length > 0) {
        console.table(r.rows);
      }
    });
    console.log(`Done: ${path.basename(filePath)}`);
  } catch (err) {
    console.error(`Error in ${path.basename(filePath)}:`, err.message);
    throw err;
  }
}

async function main() {
  console.log('Starting database initialization...');
  console.log(`Connecting to: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@')}`);

  try {
    await runSqlFile(path.join(__dirname, 'init_db.sql'));
    await runSqlFile(path.join(__dirname, 'seed_db.sql'));
    console.log('\nDatabase initialization complete!');
    console.log('\nNext steps:');
    console.log('  1. Add the read-only connection string to your .env:');
    console.log('     READONLY_DATABASE_URL=postgresql://analyst_readonly:readonly_secure_pass_123@<host>/<db>');
    console.log('  2. Start the backend: node index.js\n');
  } catch (err) {
    console.error('\nInitialization failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
