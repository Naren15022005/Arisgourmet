import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables for tests (must happen before AppModule is imported)
dotenv.config({ path: resolve(__dirname, '../../.env') });
// Ensure DB credentials used in CI are set for tests
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
if (!process.env.DB_USER || ['naren', 'aris_user'].includes(process.env.DB_USER)) {
  process.env.DB_USER = process.env.DB_USER_OVERRIDE || 'copilot';
  process.env.DB_PASSWORD = process.env.DB_PASSWORD_OVERRIDE || 'StrongTempPass123!';
}
// import AppModule dynamically inside beforeAll so env is loaded first

describe('Mesas API (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    try {
      const { AppModule } = await import('../app.module');
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = moduleFixture.createNestApplication();
      await app.init();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('beforeAll mesas.e2e.spec.ts error:', err && err.stack ? err.stack : err);
      throw err;
    }
  }, 20000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /api/mesas should return 200 and an array', async () => {
    const res = await request(app.getHttpServer()).get('/api/mesas').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  }, 10000);
});
