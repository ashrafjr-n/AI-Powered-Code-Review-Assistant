import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import {
  loginSchema,
  registerSchema,
  type LoginDto,
  type RegisterDto,
} from './auth.schemas.js';
import { AuthService, type PublicUser } from './auth.service.js';
import { AUTH_COOKIE } from './auth.types.js';
import { CurrentUserId } from './current-user-id.decorator.js';
import { Public } from './public.decorator.js';

export const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions: CookieOptions = {
  httpOnly: true, // JavaScript in the browser can't read it (XSS can't steal it)
  sameSite: 'lax', // not sent on cross-site POSTs (CSRF protection)
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  path: '/',
};

// Stricter limit on login/register to slow down password guessing.
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  async register(
    @Body({ schema: registerSchema }) dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    const user = await this.auth.register(dto);
    await this.setAuthCookie(res, user.id);
    return user;
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @HttpCode(200)
  async login(
    @Body({ schema: loginSchema }) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    const user = await this.auth.login(dto);
    await this.setAuthCookie(res, user.id);
    return user;
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(AUTH_COOKIE, cookieOptions);
  }

  @Get('me')
  me(@CurrentUserId() userId: string): Promise<PublicUser> {
    return this.auth.findById(userId);
  }

  private async setAuthCookie(res: Response, userId: string): Promise<void> {
    const token = await this.auth.signToken(userId);
    res.cookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: TOKEN_TTL_MS });
  }
}
