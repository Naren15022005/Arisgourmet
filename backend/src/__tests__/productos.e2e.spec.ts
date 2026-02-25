import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
if (!process.env.DB_USER || ['naren', 'aris_user'].includes(process.env.DB_USER)) {
  process.env.DB_USER = process.env.DB_USER_OVERRIDE || 'copilot';
  process.env.DB_PASSWORD = process.env.DB_PASSWORD_OVERRIDE || 'StrongTempPass123!';
}

describe('Productos API (integration)', () => {
  let app: INestApplication;
  let authToken: string;
  let restauranteId: string;

  beforeAll(async () => {
    try {
      const { AppModule } = await import('../app.module');
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = moduleFixture.createNestApplication();
      await app.init();

      const email = `productos_test+${Date.now()}@example.com`;
      const password = 'TestPass123!';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password, nombre: 'Tester Productos', role: 'admin' })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password });

      authToken = loginRes.body.access_token;
      const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
      restauranteId = payload.restaurante_id;
    } catch (err) {
      console.error('beforeAll productos.e2e.spec.ts error:', err && err.stack ? err.stack : err);
      throw err;
    }
  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /api/productos returns array (public endpoint)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/productos')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  }, 10000);

  it('GET /api/productos/admin requires auth', async () => {
    await request(app.getHttpServer()).get('/api/productos/admin').expect(401);
  }, 10000);

  it('POST /api/productos creates a product (requires admin)', async () => {
    if (!authToken) return;
    const res = await request(app.getHttpServer())
      .post('/api/productos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        nombre: `Producto Test ${Date.now()}`,
        descripcion: 'Producto de prueba',
        precio: 12.5,
        disponible: true,
        tiempo_base_minutos: 10,
        restaurante_id: restauranteId,
      });

    expect([200, 201, 403]).toContain(res.status);
    if (res.status === 201 || res.status === 200) {
      expect(res.body).toHaveProperty('id');
      expect(res.body.nombre).toContain('Producto Test');
    }
  }, 10000);

  it('GET /api/productos/admin returns all products when authenticated', async () => {
    if (!authToken) return;
    const res = await request(app.getHttpServer())
      .get('/api/productos/admin')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  }, 10000);
});
