import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { clientIp } from './client-ip.js';

/**
 * Rate limits per signed-in user, per IP otherwise (login, register, health).
 * Runs after AuthGuard (both are registered in AuthModule, in that order),
 * so req.userId is already set on protected routes.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: AuthenticatedRequest): Promise<string> {
    return Promise.resolve(
      req.userId ? `user:${req.userId}` : `ip:${clientIp(req)}`,
    );
  }
}
