import request from 'supertest';
import app from '../app';

describe('Health', () => {
  it('GET /health should return 200 with success', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Foody backend is running/);
    expect(res.body.data).toHaveProperty('uptime');
  });

  it('GET / should return API info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('version');
  });
});
