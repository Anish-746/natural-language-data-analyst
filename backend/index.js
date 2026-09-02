/**
 * index.js — Server Entry Point
 *
 * Responsibilities (only):
 *   1. Bootstrap Express + Socket.io
 *   2. Mount routes (injecting io where needed)
 *   3. Register Socket.io connection logs
 *   4. Start the HTTP server
 *
 * All business logic lives in src/
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createQueryRouter } from './src/routes/query.js';
import cors from 'cors';

// ─────────────────────────────────────────────
// App & Server
// ─────────────────────────────────────────────
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.use('/api/query', createQueryRouter(io));

app.get('/health', (_req, res) =>
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  })
);

// ─────────────────────────────────────────────
// Socket.io — Connection Lifecycle
// ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Client connected:    ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 NL Data Analyst server ready`);
  console.log(`   HTTP  → http://localhost:${PORT}`);
  console.log(`   WS    → ws://localhost:${PORT}`);
  console.log(`   Model → ${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}\n`);
});
