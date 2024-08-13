import request from 'supertest';
import { app, server, wss } from '../index';
import * as redisService from '../services/redisService';

jest.mock('../services/redisService');

describe('Health Check Endpoint', () => {
  afterAll((done) => {
    wss.close();
    server.close(done);
  });

  it('should return 200 OK when all services are healthy', async () => {
    (redisService.ping as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'OK',
      redis: 'OK',
      webSocket: 'OK',
    });
  });

  it('should return 500 Error when Redis is down', async () => {
    (redisService.ping as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));

    const response = await request(app).get('/health');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: 'Error',
      message: 'Health check failed',
    });
  });
});