import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

dotenv.config({ path: resolve(__dirname, '../../.env') });
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
// Prefer provided env, but if CI/local env has other test creds override to local dev creds
if (!process.env.DB_USER || ['naren', 'aris_user'].includes(process.env.DB_USER)) {
  // Use the temporary user created for local operations (copilot) if present
  process.env.DB_USER = process.env.DB_USER_OVERRIDE || 'copilot';
  process.env.DB_PASSWORD = process.env.DB_PASSWORD_OVERRIDE || 'StrongTempPass123!';
}

describe('Auth API (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    try {
      const { AppModule } = await import('../app.module');
      const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
      app = moduleFixture.createNestApplication();
      await app.init();
    } catch (err) {
      // Log full error to help debugging CI/local bootstrap failures
      // eslint-disable-next-line no-console
      console.error('beforeAll auth.e2e.spec.ts error:', err && err.stack ? err.stack : err);
      throw err;
    }
  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('register -> login -> refresh (rotate) -> logout and invalidate old token', async () => {
    const email = `test+${Date.now()}@example.com`;
    const password = 'P4ssw0rd!';

    // create restaurante + user directly in canonical singular tables
    const ds = app.get(DataSource) as DataSource;
    const restName = `test_rest_${Date.now()}`;
    const restId = randomUUID();
    await ds.query('INSERT INTO restaurante (id, nombre) VALUES (?, ?)', [restId, restName]);
    const rows = await ds.query('SELECT id FROM restaurante WHERE id = ? LIMIT 1', [restId]);
    const restauranteId = rows[0].id;
    const passHash = await bcrypt.hash(password, 10);
    await ds.query('INSERT IGNORE INTO role (id, nombre) VALUES (?, ?)', [randomUUID(), 'cliente']);
    await ds.query(
      'INSERT INTO usuario (id, restaurante_id, email, nombre, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
      [randomUUID(), restauranteId, email, 'Tester', passHash, 'cliente'],
    );

    // login
    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
    expect([200, 201]).toContain(loginRes.status);
    expect(loginRes.body.access_token).toBeDefined();
    expect(loginRes.body.refresh_token).toBeDefined();
    const firstRefresh = loginRes.body.refresh_token as string;

    // rotate using refresh -> should return new tokens
    const rotateRes = await request(app.getHttpServer()).post('/auth/refresh').send({ refresh_token: firstRefresh });
    expect([200, 201]).toContain(rotateRes.status);
    expect(rotateRes.body.access_token).toBeDefined();
    expect(rotateRes.body.refresh_token).toBeDefined();
    const secondRefresh = rotateRes.body.refresh_token as string;
    expect(secondRefresh).not.toEqual(firstRefresh);

    // old token should now be invalid (attempting to rotate should 401)
    await request(app.getHttpServer()).post('/auth/refresh').send({ refresh_token: firstRefresh }).expect(401);

    // logout (revoke second token)
    const logoutRes = await request(app.getHttpServer()).post('/auth/logout').send({ refresh_token: secondRefresh });
    expect([200, 201]).toContain(logoutRes.status);
    expect(logoutRes.body.success).toBeTruthy();

    // using second refresh after logout should fail
    await request(app.getHttpServer()).post('/auth/refresh').send({ refresh_token: secondRefresh }).expect(401);
  }, 40000);
});
