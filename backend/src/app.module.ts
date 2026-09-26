import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { ChatModule } from './chat/chat.module.js';
import { FilesModule } from './files/files.module.js';
import { HealthController } from './health/health.controller.js';
import { InsightsModule } from './insights/insights.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { ProvidersModule } from './providers/providers.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';

@Module({
  imports: [
    // Default: 100 requests per minute per user (per IP when signed out).
    // Auth routes set a stricter limit. The guard is registered in AuthModule.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
      // Shown to users as is (the default is "ThrottlerException: Too Many Requests").
      errorMessage: 'Too many requests. Wait a minute, then try again.',
    }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    FilesModule,
    ProvidersModule,
    ReviewsModule,
    ChatModule,
    InsightsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
