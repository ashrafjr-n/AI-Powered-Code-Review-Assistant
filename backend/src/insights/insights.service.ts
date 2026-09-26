import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import type { InsightKind } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { providerClient } from '../providers/provider-client.js';
import { ProjectsService } from '../projects/projects.service.js';
import { ProvidersService } from '../providers/providers.service.js';
import { buildInsightMessages, pickInsightFiles } from './insight-prompt.js';

// Same limit as reviews and chat: answer before the frontend's fetch gives up (300 s).
const INSIGHT_TIMEOUT_MS = 270_000;
const MAX_CONTENT_CHARS = 30_000;

export interface InsightView {
  id: string;
  kind: InsightKind;
  content: string;
  filePaths: string[];
  /** Project.codeVersion when the files were read. */
  codeVersion: number;
  providerName: string;
  model: string;
  createdAt: Date;
}

const insightSelect = {
  id: true,
  kind: true,
  content: true,
  filePaths: true,
  codeVersion: true,
  providerName: true,
  model: true,
  createdAt: true,
} as const;

@Injectable()
export class InsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: ProvidersService,
    private readonly projects: ProjectsService,
  ) {}

  async list(userId: string, projectId: string): Promise<InsightView[]> {
    await this.projects.findOwned(userId, projectId);
    return this.prisma.insight.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: insightSelect,
    });
  }

  /** Generates (or regenerates) one document. Saved only if the model answers. */
  async generate(
    userId: string,
    projectId: string,
    kind: InsightKind,
  ): Promise<InsightView> {
    const project = await this.projects.findOwned(userId, projectId);
    const files = await this.prisma.file.findMany({
      where: { projectId },
      orderBy: { path: 'asc' },
      select: { path: true, content: true, sensitive: true },
    });
    // Sensitive files (env, keys…) keep their path in the file list, never their content.
    const readable = files.filter((file) => !file.sensitive);
    if (files.length === 0)
      throw new BadRequestException('Upload the project code first.');
    const picked = pickInsightFiles(kind, readable);

    // SDK errors bubble up to useProvider(), which turns them into a 502.
    const { content, provider } = await this.providers.useProvider(
      userId,
      async (provider) => {
        const completion = await providerClient(
          provider.baseUrl,
          provider.apiKey,
          INSIGHT_TIMEOUT_MS,
        ).chat.completions.create({
          model: provider.model,
          messages: buildInsightMessages({
            kind,
            projectName: project.name,
            allPaths: files.map((file) => file.path),
            files: picked,
          }),
        });
        const text = completion.choices[0]?.message?.content?.trim();
        if (!text)
          throw new BadGatewayException(
            'The model returned an empty document.',
          );
        return { content: text.slice(0, MAX_CONTENT_CHARS), provider };
      },
    );

    const data = {
      content,
      filePaths: picked.map((file) => file.path),
      codeVersion: project.codeVersion,
      providerName: provider.name,
      model: provider.model,
      createdAt: new Date(),
    };
    return this.prisma.insight.upsert({
      where: { projectId_kind: { projectId, kind } },
      create: { projectId, kind, ...data },
      update: data,
      select: insightSelect,
    });
  }
}
