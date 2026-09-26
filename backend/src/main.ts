import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Hosts like Render put one proxy in front of the app: trust exactly that hop,
  // so req.ip (used by the rate limiter) is the caller, not the proxy.
  // Only the last X-Forwarded-For entry is trusted, so callers can't fake it.
  app.set('trust proxy', 1);
  configureApp(app);
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
