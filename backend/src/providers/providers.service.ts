import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { requireEnv } from '../common/env.js';
import {
  decryptSecret,
  encryptSecret,
  parseKey,
} from '../common/secret-box.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  assertSafeBaseUrl,
  describeProviderError,
  providerClient,
  ProviderError,
} from './provider-client.js';
import type {
  ProviderInput,
  TestConnectionInput,
} from './providers.schemas.js';

/** What the browser sees: never the key, only whether one is stored. */
export interface ProviderView {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
  isDefault: boolean;
}

/** Everything needed to call the provider in use. Server-side only (holds the key). */
export interface ActiveProvider {
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string | null;
}

export interface ConnectionResult {
  ok: boolean;
  message: string;
  models: string[];
}

const viewSelect = {
  id: true,
  name: true,
  baseUrl: true,
  model: true,
  apiKeyEncrypted: true,
  isDefault: true,
} as const;

function toView({
  apiKeyEncrypted,
  ...row
}: {
  apiKeyEncrypted: string | null;
} & Omit<ProviderView, 'hasApiKey'>): ProviderView {
  return { ...row, hasApiKey: apiKeyEncrypted !== null };
}

@Injectable()
export class ProvidersService {
  private readonly key = parseKey(requireEnv('ENCRYPTION_KEY'));
  // Only local development may call localhost / private networks (SSRF guard).
  private readonly allowLocal = process.env.ALLOW_LOCAL_PROVIDERS === 'true';

  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<ProviderView[]> {
    const rows = await this.prisma.aiProvider.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: viewSelect,
    });
    return rows.map(toView);
  }

  async create(userId: string, input: ProviderInput): Promise<ProviderView> {
    await this.checkUrl(input.baseUrl);
    // The first provider is used for reviews right away.
    const isDefault =
      (await this.prisma.aiProvider.count({ where: { userId } })) === 0;
    const row = await this.prisma.aiProvider.create({
      data: {
        userId,
        name: input.name,
        baseUrl: input.baseUrl,
        model: input.model,
        apiKeyEncrypted: input.apiKey
          ? encryptSecret(input.apiKey, this.key)
          : null,
        isDefault,
      },
      select: viewSelect,
    });
    return toView(row);
  }

  async update(
    userId: string,
    id: string,
    input: ProviderInput,
  ): Promise<ProviderView> {
    const stored = await this.findOwned(userId, id);
    // Same rule as testConnection: a new URL needs the key typed again.
    if (
      stored.apiKeyEncrypted &&
      !input.apiKey &&
      stored.baseUrl !== input.baseUrl
    )
      throw new BadRequestException(
        'Enter the API key again when you change the base URL.',
      );
    await this.checkUrl(input.baseUrl);
    const row = await this.prisma.aiProvider.update({
      where: { id },
      data: {
        name: input.name,
        baseUrl: input.baseUrl,
        model: input.model,
        // Empty key = keep the stored one.
        ...(input.apiKey && {
          apiKeyEncrypted: encryptSecret(input.apiKey, this.key),
        }),
      },
      select: viewSelect,
    });
    return toView(row);
  }

  async setDefault(userId: string, id: string): Promise<void> {
    await this.findOwned(userId, id);
    await this.prisma.$transaction([
      this.prisma.aiProvider.updateMany({
        where: { userId, NOT: { id } },
        data: { isDefault: false },
      }),
      this.prisma.aiProvider.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);
  }

  async remove(userId: string, id: string): Promise<void> {
    const provider = await this.findOwned(userId, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.aiProvider.delete({ where: { id } });
      if (!provider.isDefault) return;
      // Keep one provider "in use" if any are left.
      const next = await tx.aiProvider.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (next)
        await tx.aiProvider.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
    });
  }

  /** The provider "in use", with its key decrypted. 400 when none is set up. */
  async getActive(userId: string): Promise<ActiveProvider> {
    const row = await this.prisma.aiProvider.findFirst({
      where: { userId, isDefault: true },
      select: { name: true, baseUrl: true, model: true, apiKeyEncrypted: true },
    });
    if (!row)
      throw new BadRequestException(
        'Add a model provider in Settings before running a review.',
      );
    return {
      name: row.name,
      baseUrl: row.baseUrl,
      model: row.model,
      apiKey: row.apiKeyEncrypted
        ? decryptSecret(row.apiKeyEncrypted, this.key)
        : null,
    };
  }

  /** The URL guard for other modules (reviews, chat): check again before every call. */
  assertCallable(baseUrl: string): Promise<void> {
    return assertSafeBaseUrl(baseUrl, this.allowLocal);
  }

  /** Calls GET {baseUrl}/models. Never throws: the result says what went wrong. */
  async testConnection(
    userId: string,
    input: TestConnectionInput,
  ): Promise<ConnectionResult> {
    const stored =
      !input.apiKey && input.providerId
        ? await this.findOwned(userId, input.providerId)
        : null;
    try {
      // The stored key only goes to the URL it was saved with, so a changed URL
      // can't be used to send the key somewhere else.
      const apiKey =
        stored?.apiKeyEncrypted && stored.baseUrl === input.baseUrl
          ? decryptSecret(stored.apiKeyEncrypted, this.key)
          : input.apiKey || null;
      await assertSafeBaseUrl(input.baseUrl, this.allowLocal);
      const page = await providerClient(
        input.baseUrl,
        apiKey,
        10_000,
      ).models.list();
      const models = page.data.map((model) => model.id).sort();
      return {
        ok: true,
        message: `Connected. ${models.length} model${models.length === 1 ? '' : 's'} found.`,
        models,
      };
    } catch (error) {
      return { ok: false, message: describeProviderError(error), models: [] };
    }
  }

  private async checkUrl(baseUrl: string): Promise<void> {
    try {
      await assertSafeBaseUrl(baseUrl, this.allowLocal);
    } catch (error) {
      if (error instanceof ProviderError)
        throw new BadRequestException(error.message);
      throw error;
    }
  }

  private async findOwned(userId: string, id: string) {
    const provider = await this.prisma.aiProvider.findFirst({
      where: { id, userId },
      select: { baseUrl: true, isDefault: true, apiKeyEncrypted: true },
    });
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }
}
