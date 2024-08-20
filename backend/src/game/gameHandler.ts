import WebSocket from 'ws';
import { TetrisGame } from './TetrisGame';
import { redis } from '../services/redisService';
import { log, error } from '../utils/logger';
import { RateLimiter } from '../utils/rateLimiter';
import { Move } from './types';

const games = new Map<string, TetrisGame>();
const moveLimiter = new RateLimiter(10, 1000);

export async function handleClientMessage(ws: WebSocket, clientId: string, message: string): Promise<void> {
  try {
    const data = JSON.parse(message);
    
    if (data.type === 'START_GAME') {
      await startNewGame(ws, clientId);
    } else if (data.type === 'MOVE') {
      await handleMove(ws, clientId, data.move);
    } else {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message type' }));
    }
  } catch (err) {
    error(`Error handling message for client ${clientId}`, err as Error);
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Internal server error' }));
  }
}

async function startNewGame(ws: WebSocket, clientId: string): Promise<void> {
  const game = new TetrisGame();
  games.set(clientId, game);
  await game.saveState();
  ws.send(JSON.stringify({ type: 'GAME_STATE', gameState: game.getState() }));
}

async function handleMove(ws: WebSocket, clientId: string, move: Move): Promise<void> {
  if (!moveLimiter.tryAcquire(clientId)) {
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Rate limit exceeded' }));
    return;
  }

  const game = games.get(clientId);
  if (!game) {
    ws.send(JSON.stringify({ type: 'ERROR', message: 'No active game found' }));
    return;
  }

  if (game.makeMove(move)) {
    game.update();
    await game.saveState();
    ws.send(JSON.stringify({ type: 'GAME_STATE', gameState: game.getState() }));
  } else {
    ws.send(JSON.stringify({ type: 'INVALID_MOVE' }));
  }
}

export async function cleanupGame(clientId: string): Promise<void> {
  games.delete(clientId);
  await redis.del(`gameState:${clientId}`);
}