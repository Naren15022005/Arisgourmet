import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: process.env.ENV_PATH || resolve(__dirname, '../../.env') });
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { metricsMiddleware } from './metrics';
import * as promClient from 'prom-client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(metricsMiddleware());

  // expose /metrics
  app.getHttpAdapter().get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  });
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
  console.log('Backend running on port', process.env.PORT || 4000);
}

bootstrap();
