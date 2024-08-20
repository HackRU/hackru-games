import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import * as redisService from '@/services/redisService';
import { log, error } from '@/utils/logger';
import { handleClientMessage, cleanupGame } from '@/game/gameHandler';
import { authenticateClient } from '@/auth/authHandler';

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

// WebSocket connection handler
wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage) => {
  try {
    const clientId = await authenticateClient(req);
    if (!clientId) {
      ws.close(1008, 'Authentication failed');
      return;
    }

    log(`Client ${clientId} connected`);

    ws.on('message', (message: string) => {
      handleClientMessage(ws, clientId, message);
    });

    ws.on('close', () => {
      log(`Client ${clientId} disconnected`);
      cleanupGame(clientId);
    });
  } catch (err) {
    error('WebSocket connection error', err as Error);
    ws.close(1011, 'Internal server error');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log(`Server is running on port ${PORT}`);
});

export { app, server, wss };