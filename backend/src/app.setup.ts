import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { Express, NextFunction, Response } from 'express';

// Shared by main.ts and the e2e tests, so tests run the same app as production.
export function configureApp(app: INestApplication): void {
  // All routes live under /api, so the frontend can proxy /api/* to this server.
  app.setGlobalPrefix('api');
  // Don't advertise the framework ("X-Powered-By: Express").
  (app.getHttpAdapter().getInstance() as Express).disable('x-powered-by');
  // JSON only: browsers must never guess another content type.
  app.use((_req: unknown, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use(cookieParser());
  // Validates every @Body/@Query/@Param that has a { schema } (Zod) attached.
  app.useGlobalPipes(new StandardSchemaValidationPipe());
}
