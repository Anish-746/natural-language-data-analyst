/**
 * src/agents/analyst.js
 * Factory that creates a fresh ReAct analyst agent per request.
 * A new agent per request ensures clean message history and avoids
 * state bleed between concurrent users.
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createAgent } from 'langchain';
import { HumanMessage } from '@langchain/core/messages';
import DB_SCHEMA_JSON from '../constants/schema.js';
import { createSqlTool } from '../tools/sqlTool.js';
import { createSchemaTool } from '../tools/schemaTool.js';
import logger from '../utils/logger.js';

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL,
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
  maxRetries: 5,
});

const tableSummaries = Object.entries(DB_SCHEMA_JSON)
  .map(([name, schema]) => `- ${name}: ${schema.description}`)
  .join('\n');

const SYSTEM_PROMPT = `You are an expert data analyst AI. Your job is to answer questions about an e-commerce database by writing and executing PostgreSQL SELECT queries.

Rules:
1. ALWAYS use the execute_read_only_sql tool to query the database before answering.
2. If you don't know the exact columns of a table, use get_table_schema to retrieve them before writing your SQL.
3. If a query fails with SQL_ERROR, read the error carefully, fix the SQL, and retry. You may retry up to 3 times.
4. After getting successful results, provide a clear, concise answer.
5. Always include the final data in a JSON code block so the frontend can visualize it.
6. Format your final answer as:
   - A brief one-sentence summary
   - The data wrapped in \`\`\`json ... \`\`\` (use the "rows" array from the tool result)

Available Tables:
${tableSummaries}`;

/**
 * Creates and invokes the ReAct analyst agent.
 * @param {object}   opts
 * @param {string}   opts.question  - The user's natural language question
 * @param {import('socket.io').Server} opts.io - Socket.io server for status events
 * @param {string|null} opts.socketId - Client socket ID
 * @returns {Promise<{ answer: string, data: object|null }>}
 */
export async function runAnalystAgent({ question, io, socketId }) {
  const sqlTool = createSqlTool(io, socketId);
  const schemaTool = createSchemaTool(io, socketId);

  const agent = createAgent({
    model: llm,
    tools: [sqlTool, schemaTool],
    messageModifier: SYSTEM_PROMPT,
  });

  const startTime = Date.now();

  const result = await agent.invoke(
    { messages: [new HumanMessage(question)] },
    {
      recursionLimit: 15, // ~3 SQL retries before giving up
      configurable: { thread_id: socketId || 'anonymous' },
    }
  );

  const messages = result.messages;
  const lastMessage = messages[messages.length - 1];
  const answer = lastMessage?.content || '';

  // Extract the JSON data block the agent embedded in its answer
  const jsonMatch = answer.match(/```json\s*([\s\S]*?)```/);
  let data = null;
  if (jsonMatch) {
    try {
      data = JSON.parse(jsonMatch[1].trim());
    } catch {
      // LLM produced invalid JSON — visualization falls back gracefully
    }
  }

  const totalLatencyMs = Date.now() - startTime;
  
  // Calculate metrics
  let sqlRetries = 0;
  let dbLatencyMs = 0;
  
  messages.forEach(msg => {
    if (msg._getType() === 'tool') {
      if (msg.name === 'execute_read_only_sql') {
        if (msg.content.startsWith('SQL_ERROR')) {
          sqlRetries++;
        }
        // DB latency could be parsed if we embed it, but for simplicity we track it in sqlTool.
      }
    }
  });

  const success = !answer.includes('SQL_ERROR') && !!data;

  logger.info('Agent Request Completed', {
    type: 'metric',
    data: {
      socketId: socketId || 'anonymous',
      latencyMs: totalLatencyMs,
      sqlRetries,
      success
    }
  });

  return { answer, data };
}
