import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { requireEnv } from '../common/env.js';
import { UserThrottlerGuard } from '../common/user-throttler.guard.js';
import { AuthController, TOKEN_TTL_MS } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { LoginAttempts } from './login-attempts.js';

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
    LoginAttempts,
    // Global guards run in this order: first the login check (sets req.userId),
    // then the rate limit, which counts per user when signed in.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
  ],
})
export class AuthModule {}
