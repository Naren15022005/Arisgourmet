import * as request from 'supertest';

const API = process.env.API_URL || 'http://localhost:4000';

describe('Mesas API (integration)', () => {
  it('GET /api/mesas should return 200 and an array', async () => {
    const res = await request(API).get('/api/mesas').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  }, 10000);
});
