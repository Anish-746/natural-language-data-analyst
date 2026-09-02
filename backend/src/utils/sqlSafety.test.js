import { describe, it, expect } from 'vitest';
import { isSafeQuery } from './sqlSafety.js';

describe('SQL Safety AST Validator', () => {
  it('should allow simple SELECT queries on allowed tables', () => {
    const result = isSafeQuery('SELECT * FROM users');
    expect(result.safe).toBe(true);
    expect(result.sanitizedSql).toContain('LIMIT (200)');
  });

  it('should allow SELECT queries with explicit limits', () => {
    const result = isSafeQuery('SELECT id FROM orders LIMIT 10');
    expect(result.safe).toBe(true);
    expect(result.sanitizedSql).toContain('LIMIT (10)');
  });

  it('should limit excessively large explicit limits', () => {
    const result = isSafeQuery('SELECT id FROM orders LIMIT 10000');
    expect(result.safe).toBe(true);
    expect(result.sanitizedSql).toContain('LIMIT (200)');
  });

  it('should block DROP TABLE statements', () => {
    const result = isSafeQuery('DROP TABLE users;');
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('Only SELECT statements');
  });

  it('should block DELETE statements', () => {
    const result = isSafeQuery('DELETE FROM orders;');
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('Only SELECT statements');
  });

  it('should block queries to unauthorized tables', () => {
    const result = isSafeQuery('SELECT * FROM pg_catalog.pg_tables');
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('Unauthorized table access');
  });

  it('should allow queries using CTEs (WITH clauses)', () => {
    const result = isSafeQuery(`
      WITH recent_orders AS (SELECT * FROM orders)
      SELECT * FROM recent_orders;
    `);
    expect(result.safe).toBe(true);
  });

  it('should block multiple SQL statements', () => {
    const result = isSafeQuery('SELECT * FROM users; SELECT * FROM orders;');
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('single SQL statement is allowed');
  });
});
