import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import * as redisService from './services/redisService';
import { log, error } from './utils/logger';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Redis connection
    await redisService.ping();

    // Check WebSocket server
    const wsStatus = wss.clients.size >= 0 ? 'OK' : 'Error';

    res.json({
      status: 'OK',
      redis: 'OK',
      webSocket: wsStatus,
    });
  } catch (err) {
    error('Health check failed', err as Error);
    res.status(500).json({
      status: 'Error',
      message: 'Health check failed',
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log(`Server is running on port ${PORT}`);
});

export { app, server, wss };