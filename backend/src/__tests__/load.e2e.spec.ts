import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_USER = process.env.DB_USER || 'db_admin';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'Secr3t';
process.env.DB_NAME = process.env.DB_NAME || 'arisgourmet';

describe('Load test (integration)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const { AppModule } = await import('../app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('runs concurrent auth flows in batches', async () => {
    const server = app.getHttpServer();
    const concurrency = 20; // parallel requests per batch (reduced)
    const batches = 3; // number of batches

    const runSingle = async (idx: number) => {
      const email = `load+${Date.now()}+${idx}@example.com`;
      const password = 'LoadTest123!';

      // lightweight flow: register -> login
      // retry helper for transient network resets
      const tryWithRetry = async (fn: () => Promise<any>, attempts = 3, delayMs = 100) => {
        let lastErr;
        for (let a = 0; a < attempts; a++) {
          try {
            return await fn();
          } catch (err) {
            lastErr = err;
            await new Promise(r => setTimeout(r, delayMs * (a + 1)));
          }
        }
        throw lastErr;
      };

      await tryWithRetry(() => request(server).post('/auth/register').send({ email, password, nombre: 'Load' }).expect(201));
      const loginRes = await tryWithRetry(() => request(server).post('/auth/login').send({ email, password }));
      if (![200, 201].includes(loginRes.status)) {
        throw new Error(`login failed status=${loginRes.status}`);
      }
      return { status: loginRes.status };
    };

    for (let b = 0; b < batches; b++) {
      const promises: Promise<any>[] = [];
      for (let i = 0; i < concurrency; i++) {
        promises.push(runSingle(b * concurrency + i));
      }
      const results = await Promise.allSettled(promises);
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        // throw aggregated error for Jest
        const reasons = failures.slice(0,5).map(f => (f as PromiseRejectedResult).reason.toString());
        throw new Error(`Batch ${b} had ${failures.length} failures. Examples: ${reasons.join('; ')}`);
      }
    }
  }, 300000);
});
