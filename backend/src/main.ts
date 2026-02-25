import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: process.env.ENV_PATH || resolve(__dirname, '../../.env') });
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { metricsMiddleware } from './metrics';
import { NotificationsService } from './notifications/notifications.service';
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

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
  console.log('Backend running on port', port);

  // Initialize WebSocket gateway after HTTP server is listening
  const notificationsService = app.get(NotificationsService);
  notificationsService.init(app.getHttpServer());
}

bootstrap();
