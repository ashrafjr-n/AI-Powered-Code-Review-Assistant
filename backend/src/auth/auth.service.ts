import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto, RegisterDto } from './auth.schemas.js';
import type { JwtPayload } from './auth.types.js';
import { hashPassword, verifyPassword } from './password.js';

// Never select passwordHash into anything we send back.
const publicUser = { id: true, email: true, name: true } as const;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUser }>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          passwordHash: await hashPassword(dto.password),
        },
        select: publicUser,
      });
    } catch (error) {
      // P2002 = unique constraint failed. The DB is the real guard against duplicates (no race).
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      // One message for both cases, so we don't tell attackers which emails exist.
      throw new UnauthorizedException('Invalid email or password');
    }
    return { id: user.id, email: user.email, name: user.name };
  }

  async findById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUser,
    });
    if (!user) {
      // Valid token, but the user was deleted.
      throw new UnauthorizedException();
    }
    return user;
  }

  signToken(userId: string): Promise<string> {
    const payload: JwtPayload = { sub: userId };
    return this.jwt.signAsync(payload);
  }
}
