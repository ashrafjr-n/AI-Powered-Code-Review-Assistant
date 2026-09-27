import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { requireEnv } from '../common/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: requireEnv('DATABASE_URL'),
        // pg closes idle connections after 10 s, so the next click paid a new TLS
        // handshake to Neon. 60 s stays well below Neon's ~5 min suspend, so a pooled
        // connection is closed by us before Neon can drop it.
        idleTimeoutMillis: 60_000,
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
