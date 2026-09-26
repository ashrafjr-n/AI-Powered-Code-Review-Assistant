import type { Request } from 'express';

export const AUTH_COOKIE = 'access_token';

export interface JwtPayload {
  sub: string;
}

export interface AuthenticatedRequest extends Request {
  userId: string;
}
