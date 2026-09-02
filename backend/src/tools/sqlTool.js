/**
 * src/tools/sqlTool.js
 * Factory that creates the `execute_read_only_sql` LangChain tool.
 * Accepts a socketId so it can emit WebSocket events during execution.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import readonlyPool from '../config/db.js';
import { isSafeQuery } from '../utils/sqlSafety.js';
import logger from '../utils/logger.js';

/**
 * Creates the SQL execution tool bound to a specific WebSocket socket.
 * @param {import('socket.io').Server} io  - The Socket.io server instance
 * @param {string|null} socketId           - Target client socket ID for status updates
 */
export function createSqlTool(io, socketId) {
  /** Emit a typed event to the connected client */
  const emit = (event, data) => {
    if (socketId && io) {
      io.to(socketId).emit(event, { ...data, timestamp: new Date().toISOString() });
    }
  };

  return tool(
    async ({ sql_query }) => {
      emit('agent:tool_start', {
        message: '⚡ Executing SQL query...',
        sql: sql_query,
      });

      // Application-level safety guard (DB role is the primary enforcement)
      const safety = isSafeQuery(sql_query);
      if (!safety.safe) {
        const errorMsg = `SECURITY ERROR: ${safety.reason} Query rejected without execution.`;
        emit('agent:error', {
          message: '🔒 Query blocked by security guard',
          error: errorMsg,
        });
        return errorMsg;
      }

      try {
        const start = Date.now();
        const result = await readonlyPool.query(safety.sanitizedSql);
        const elapsed = Date.now() - start;
        const { rows, fields } = result;

        logger.info('SQL Tool Executed', {
          type: 'metric',
          data: {
            socketId: socketId || 'anonymous',
            dbLatencyMs: elapsed,
            rowCount: rows.length,
            success: true
          }
        });

        emit('agent:tool_result', {
          message: `✅ Query succeeded — ${rows.length} row(s) in ${elapsed}ms`,
          rowCount: rows.length,
          elapsed,
        });

        return JSON.stringify({
          success: true,
          rowCount: rows.length,
          columns: fields.map((f) => f.name),
          rows: rows.slice(0, 200), // cap to avoid token overflow
        });
      } catch (err) {
        logger.info('SQL Tool Error', {
          type: 'metric',
          data: {
            socketId: socketId || 'anonymous',
            success: false,
            error: err.message
          }
        });

        // Return the raw error string so the LLM can read it and self-heal
        const errorMsg = `SQL_ERROR: ${err.message}`;
        emit('agent:error', {
          message: '❌ SQL error — AI will rewrite and retry...',
          error: err.message,
        });
        return errorMsg;
      }
    },
    {
      name: 'execute_read_only_sql',
      description: `Executes a read-only SELECT SQL query against the PostgreSQL database and returns results as JSON.
Always use this tool to answer the user's question.
If the query returns SQL_ERROR, analyze the error, fix the SQL, and retry. You may retry up to 3 times.`,
      schema: z.object({
        sql_query: z
          .string()
          .describe(
            'A valid PostgreSQL SELECT query. Must not contain DML or DDL statements.'
          ),
      }),
    }
  );
}
