import 'reflect-metadata';
import { Test } from '@nestjs/testing';

(async () => {
  try {
    // align env like the tests to avoid trying to connect to docker host 'mysql'
    process.env.DB_HOST = process.env.DB_HOST || 'localhost';
    process.env.DB_PORT = process.env.DB_PORT || '3306';
    process.env.DB_USER = process.env.DB_USER || 'aris_user';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD || 's3cr3t';
    const { AppModule } = await import('../backend/src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    console.log('Bootstrap OK');
    await app.close();
  } catch (err) {
    console.error('Bootstrap error:');
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 2;
  }
})();
