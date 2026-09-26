import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

// Shared by main.ts and the e2e tests, so tests run the same app as production.
export function configureApp(app: INestApplication): void {
  // All routes live under /api, so the frontend can proxy /api/* to this server.
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  // Validates every @Body/@Query/@Param that has a { schema } (Zod) attached.
  app.useGlobalPipes(new StandardSchemaValidationPipe());
}
