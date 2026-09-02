/**
 * src/tools/schemaTool.js
 * Tool that allows the LLM to dynamically look up the schema of specific tables.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import DB_SCHEMA_JSON from '../constants/schema.js';

export function createSchemaTool(io, socketId) {
  const emit = (event, data) => {
    if (socketId && io) {
      io.to(socketId).emit(event, { ...data, timestamp: new Date().toISOString() });
    }
  };

  return tool(
    async ({ table_names }) => {
      emit('agent:tool_start', {
        message: `🔍 Looking up schema for: ${table_names.join(', ')}`,
      });

      const results = {};
      const notFound = [];

      for (const name of table_names) {
        if (DB_SCHEMA_JSON[name]) {
          results[name] = DB_SCHEMA_JSON[name];
        } else {
          notFound.push(name);
        }
      }

      let response = '';
      if (Object.keys(results).length > 0) {
        response += JSON.stringify(results, null, 2);
      }
      if (notFound.length > 0) {
        response += `\nWarning: Tables not found: ${notFound.join(', ')}`;
      }

      emit('agent:tool_result', {
        message: `✅ Retrieved schema for ${Object.keys(results).length} table(s)`,
      });

      return response;
    },
    {
      name: 'get_table_schema',
      description: 'Retrieve the detailed schema (columns, types, descriptions) for one or more tables.',
      schema: z.object({
        table_names: z.array(z.string()).describe('An array of table names to look up (e.g., ["users", "orders"]).')
      }),
    }
  );
}
