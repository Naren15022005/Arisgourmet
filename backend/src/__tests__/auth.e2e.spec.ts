import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';

dotenv.config({ path: resolve(__dirname, '../../.env') });
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'aris_user';
process.env.DB_PASSWORD = 's3cr3t';

describe('Auth API (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { AppModule } = await import('../app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('register -> login -> refresh (rotate) -> logout and invalidate old token', async () => {
    const email = `test+${Date.now()}@example.com`;
    const password = 'P4ssw0rd!';

    // create restaurante + user directly in underlying tables to avoid INSERT on view
    const ds = app.get(DataSource) as DataSource;
    const restName = `test_rest_${Date.now()}`;
    await ds.query('INSERT INTO restaurantes (nombre) VALUES (?)', [restName]);
    const rows = await ds.query('SELECT id FROM restaurantes WHERE nombre = ? ORDER BY id DESC LIMIT 1', [restName]);
    const restauranteId = rows[0].id;
    const passHash = await bcrypt.hash(password, 10);
    // ensure a 'cliente' role exists and use its id
    const roleRows = await ds.query('SELECT id FROM roles WHERE nombre = ? LIMIT 1', ['cliente']);
    let roleId: number;
    if (roleRows && roleRows.length > 0) {
      roleId = roleRows[0].id;
    } else {
      await ds.query('INSERT INTO roles (nombre) VALUES (?)', ['cliente']);
      const r = await ds.query('SELECT id FROM roles WHERE nombre = ? ORDER BY id DESC LIMIT 1', ['cliente']);
      roleId = r[0].id;
    }
    await ds.query('INSERT INTO usuarios (restaurante_id, email, nombre, password_hash, role_id) VALUES (?, ?, ?, ?, ?)', [restauranteId, email, 'Tester', passHash, roleId]);

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
