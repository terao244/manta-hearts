import request from 'supertest';
import { app, server } from '../server';

describe('Server', () => {
  afterAll(async () => {
    server.close();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/info', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/api/info').expect(200);

      expect(response.body).toHaveProperty('name', 'Hearts Game Backend');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      await request(app).get('/unknown-endpoint').expect(404);
    });
  });
});
