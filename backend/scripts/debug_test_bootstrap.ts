import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';

async function debug() {
  try {
    console.log('ENV', { DB_USER: process.env.DB_USER, DB_PASSWORD: !!process.env.DB_PASSWORD });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    console.log('About to init app');
    await app.init();
    console.log('App initialized');
    await app.close();
    console.log('App closed');
  } catch (err) {
    console.error('Bootstrap error', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

debug();
