import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// The built-in demo model: lets people try Redline before adding their own key.
// Configured only by env (the key never touches the database or the browser):
//   DEMO_BASE_URL, DEMO_MODEL, DEMO_API_KEY (optional), DEMO_NAME (optional),
//   DEMO_DAILY_LIMIT_PER_USER (default 10), DEMO_DAILY_LIMIT_TOTAL (default 200),
//   DEMO_MAX_CHARS (default 160000: how much code one review may send; the demo is a
//   large-context model, so whole projects fit better than with the 48k default).

export interface DemoConfig {
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string | null;
  perUser: number;
  total: number;
  /** Review budget in characters (see review-prompt.ts MAX_REVIEW_CHARS). */
  maxChars: number;
}

export type DemoStatus =
  | { enabled: false }
  | {
      enabled: true;
      name: string;
      model: string;
      used: number;
      limit: number;
      /** Start of the next UTC day, when the counts go back to zero. */
      resetsAt: Date;
      /** The whole site used its daily total (everyone is blocked until reset). */
      siteLimitReached: boolean;
    };

// Any constant works; it only has to be the same for every demo reservation.
const DEMO_LOCK_KEY = 4_242_001;

function today(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function nextReset(day: Date): Date {
  return new Date(day.getTime() + 24 * 60 * 60 * 1000);
}

/** 429 with a code the frontend turns into the "add your own model" panel. */
function demoLimitError(reason: 'user' | 'site', resetsAt: Date) {
  return new HttpException(
    {
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      code: 'DEMO_LIMIT',
      reason,
      resetsAt,
      message:
        reason === 'user'
          ? "You've used today's free demo requests."
          : 'The free demo is used up for today on the whole site.',
    },
    HttpStatus.TOO_MANY_REQUESTS,
  );
}

export function demoBusyError() {
  return new HttpException(
    {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      code: 'DEMO_BUSY',
      message: 'The free demo model is busy right now.',
    },
    HttpStatus.SERVICE_UNAVAILABLE,
  );
}

@Injectable()
export class DemoService {
  constructor(private readonly prisma: PrismaService) {}

  /** null = no demo on this server. Read on each call so tests can change limits. */
  config(): DemoConfig | null {
    const baseUrl = process.env.DEMO_BASE_URL;
    const model = process.env.DEMO_MODEL;
    if (!baseUrl || !model) return null;
    return {
      name: process.env.DEMO_NAME || 'Redline demo',
      baseUrl: baseUrl.replace(/\/+$/, ''),
      model,
      apiKey: process.env.DEMO_API_KEY || null,
      perUser: Number(process.env.DEMO_DAILY_LIMIT_PER_USER) || 10,
      total: Number(process.env.DEMO_DAILY_LIMIT_TOTAL) || 200,
      maxChars: Number(process.env.DEMO_MAX_CHARS) || 160_000,
    };
  }

  async status(userId: string): Promise<DemoStatus> {
    const config = this.config();
    if (!config) return { enabled: false };
    const day = today();
    const [mine, all] = await Promise.all([
      this.prisma.demoUsage.findUnique({
        where: { userId_day: { userId, day } },
        select: { count: true },
      }),
      this.prisma.demoUsage.aggregate({
        where: { day },
        _sum: { count: true },
      }),
    ]);
    return {
      enabled: true,
      name: config.name,
      model: config.model,
      used: Math.min(mine?.count ?? 0, config.perUser),
      limit: config.perUser,
      resetsAt: nextReset(day),
      siteLimitReached: (all._sum.count ?? 0) >= config.total,
    };
  }

  /**
   * Takes one request from today's allowance or throws DEMO_LIMIT.
   * A transaction-level lock makes check + increment one step, so two parallel
   * requests can't both take the last one.
   */
  async reserve(userId: string, config: DemoConfig): Promise<void> {
    const day = today();
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${DEMO_LOCK_KEY})`;
      const [mine, all] = await Promise.all([
        tx.demoUsage.findUnique({
          where: { userId_day: { userId, day } },
          select: { count: true },
        }),
        tx.demoUsage.aggregate({ where: { day }, _sum: { count: true } }),
      ]);
      if ((mine?.count ?? 0) >= config.perUser)
        throw demoLimitError('user', nextReset(day));
      if ((all._sum.count ?? 0) >= config.total)
        throw demoLimitError('site', nextReset(day));
      await tx.demoUsage.upsert({
        where: { userId_day: { userId, day } },
        create: { userId, day, count: 1 },
        update: { count: { increment: 1 } },
      });
    });
  }

  /** Gives the request back when the model failed (the user got nothing). */
  async release(userId: string): Promise<void> {
    await this.prisma.demoUsage.updateMany({
      where: { userId, day: today(), count: { gt: 0 } },
      data: { count: { decrement: 1 } },
    });
  }
}
