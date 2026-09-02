/**
 * src/routes/query.js
 * Express router for the /api/query endpoint.
 * Receives a question + socketId, fires the agent async,
 * and streams progress to the client via WebSocket events.
 */

import { Router } from 'express';
import { runAnalystAgent } from '../agents/analyst.js';
import { classifyInput } from '../agents/classifier.js';

/**
 * Creates and returns the query router, injected with the Socket.io server.
 * @param {import('socket.io').Server} io
 */
export function createQueryRouter(io) {
  const router = Router();

  /**
   * POST /api/query
   * Body: { question: string, socketId: string }
   */
  router.post('/', async (req, res) => {
    const { question, socketId } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: '`question` is required and must be a non-empty string.' });
    }

    // Respond immediately — agent runs async and pushes updates over WebSocket
    res.json({ status: 'processing', message: 'Agent is working on your question…' });

    // Helper: emit a named event to the requesting client
    const emit = (event, data) => {
      if (socketId && io) {
        io.to(socketId).emit(event, { ...data, timestamp: new Date().toISOString() });
      }
    };

    // Run agent asynchronously
    (async () => {
      try {
        emit('agent:thinking', { message: '🛡️ Scanning input for security and intent…' });
        
        const { classification, reasoning } = await classifyInput(question);
        
        if (classification === 'PROMPT_INJECTION') {
          return emit('agent:error', {
            message: '🚨 Query blocked by security firewall',
            error: 'Input detected as potential prompt injection or malicious command.',
          });
        }
        
        if (classification === 'UNRELATED_CHAT') {
          return emit('agent:done', {
            message: 'ℹ️ Unrelated query',
            answer: 'I am a specialized Data Analyst AI. I can only answer questions about the e-commerce database (users, products, orders, subscriptions). How can I help you with your data today?',
            data: null,
          });
        }

        emit('agent:thinking', { message: '🧠 Reading schema and planning query…' });
        emit('agent:thinking', { message: '✍️ Generating SQL query…' });

        const { answer, data } = await runAnalystAgent({
          question,
          io,
          socketId,
        });

        emit('agent:done', {
          message: '🎉 Analysis complete!',
          answer,
          data,
        });
      } catch (err) {
        console.error('[Agent error]', err);
        emit('agent:fatal', {
          message: '💥 Agent encountered an unexpected error',
          error: err.message,
        });
      }
    })();
  });

  return router;
}
