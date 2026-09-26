import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { requireEnv } from '../common/env.js';
import { AuthController, TOKEN_TTL_MS } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: requireEnv('JWT_SECRET'),
        signOptions: { expiresIn: TOKEN_TTL_MS / 1000 },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Global: every route needs a valid login unless marked @Public().
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
