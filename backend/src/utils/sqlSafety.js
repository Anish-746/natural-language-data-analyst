/**
 * src/utils/sqlSafety.js
 * Advanced AST-based SQL safety guard.
 * Validates the query is a single SELECT, accesses only authorized tables,
 * and forces a hard LIMIT to prevent memory exhaustion.
 */

import { parse, toSql } from 'pgsql-ast-parser';

const ALLOWED_TABLES = new Set(['users', 'products', 'orders', 'subscriptions']);
const MAX_LIMIT = 200;

/**
 * Validates and sanitizes a SQL string.
 * @param {string} sql
 * @returns {{ safe: boolean, reason?: string, sanitizedSql?: string }}
 */
export function isSafeQuery(sql) {
  let astArray;
  try {
    astArray = parse(sql);
  } catch (err) {
    return { safe: false, reason: `SQL Parsing Error: ${err.message}` };
  }

  if (astArray.length !== 1) {
    return { safe: false, reason: 'Only a single SQL statement is allowed.' };
  }

  const stmt = astArray[0];
  if (stmt.type !== 'select' && stmt.type !== 'with') {
    return { safe: false, reason: 'Only SELECT statements (or CTEs) are allowed.' };
  }

  // 1. Extract all referenced tables and CTE aliases
  const tables = new Set();
  const ctes = new Set();

  function traverse(node) {
    if (!node || typeof node !== 'object') return;
    
    // Found a table reference
    if (node.type === 'table' && node.name && typeof node.name.name === 'string') {
      tables.add(node.name.name.toLowerCase());
    }
    
    // Found a CTE definition
    if (node.type === 'with' && Array.isArray(node.bind)) {
      for (const b of node.bind) {
        if (b.alias && typeof b.alias.name === 'string') {
          ctes.add(b.alias.name.toLowerCase());
        }
      }
    }

    // Recurse children
    for (const key of Object.keys(node)) {
      traverse(node[key]);
    }
  }

  traverse(stmt);

  // 2. Validate table authorization
  for (const table of tables) {
    // If it's not a known CTE and not an explicitly allowed table, block it.
    if (!ALLOWED_TABLES.has(table) && !ctes.has(table)) {
      return { safe: false, reason: `Unauthorized table access: "${table}"` };
    }
  }

  // 3. Enforce LIMIT
  // stmt could be a 'with' statement. If it is, its actual query is inside `stmt.in`.
  // Wait, limit might be on `stmt` or `stmt.in` depending on AST structure.
  // In pgsql-ast-parser, a SELECT has `.limit`. A WITH has `.in` which is a SELECT.
  let targetNode = stmt.type === 'with' ? stmt.in : stmt;
  
  if (targetNode && targetNode.type === 'select') {
    if (!targetNode.limit || !targetNode.limit.limit) {
      targetNode.limit = { limit: { type: 'integer', value: MAX_LIMIT } };
    } else if (
      targetNode.limit.limit.type === 'integer' &&
      targetNode.limit.limit.value > MAX_LIMIT
    ) {
      targetNode.limit.limit.value = MAX_LIMIT;
    }
  }

  // 4. Regenerate SQL
  let sanitizedSql;
  try {
    sanitizedSql = toSql.statement(stmt);
  } catch (err) {
    return { safe: false, reason: `SQL Regeneration Error: ${err.message}` };
  }

  return { safe: true, sanitizedSql };
}
