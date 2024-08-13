import Redis from 'ioredis';
import { log, error } from '../utils/logger';

let redis: Redis;

if (process.env.NODE_ENV !== 'test') {
  if (!process.env.REDIS_URL) {
    throw Error('REDIS_URL environment variable is not set');
  }
  redis = new Redis(process.env.REDIS_URL);
} else {
  // Mock Redis for testing
  redis = {
    ping: jest.fn().mockResolvedValue('PONG'),
  } as unknown as Redis;
}

export async function ping(): Promise<void> {
  try {
    await redis.ping();
  } catch (err) {
    error('Redis ping failed', err as Error);
    throw err;
  }
}

// Add other Redis-related functions here as needed

export { redis };