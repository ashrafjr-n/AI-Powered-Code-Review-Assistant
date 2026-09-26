import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, ReviewMode } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import { providerClient } from '../providers/provider-client.js';
import {
  ProvidersService,
  type ActiveProvider,
} from '../providers/providers.service.js';
import {
  highestSeverity,
  parseReviewOutput,
  type ReviewIssue,
  type ReviewOutput,
} from './review-output.js';
import {
  buildReviewMessages,
  pickFiles,
  rankForReview,
  type SourceFile,
} from './review-prompt.js';
import type { ListReviewsQuery, RunReviewDto } from './reviews.schemas.js';

// One review, including the retry, must finish before the frontend's fetch gives up (300 s).
const REVIEW_TIMEOUT_MS = 270_000;
const MIN_RETRY_MS = 20_000;

const reviewSelect = {
  id: true,
  projectId: true,
  mode: true,
  scope: true,
  filePaths: true,
  summary: true,
  issues: true,
  recommendations: true,
  highestSeverity: true,
  providerName: true,
  model: true,
  createdAt: true,
  project: { select: { name: true } },
} as const;

type ReviewRow = Prisma.ReviewGetPayload<{ select: typeof reviewSelect }>;

export type ReviewView = Omit<
  ReviewRow,
  'issues' | 'recommendations' | 'project'
> & {
  issues: ReviewIssue[];
  recommendations: string[];
  projectName: string;
};

function toView({
  project,
  issues,
  recommendations,
  ...row
}: ReviewRow): ReviewView {
  // Written by this service after Zod validation, so the JSON shape is known.
  return {
    ...row,
    issues: issues as unknown as ReviewIssue[],
    recommendations: recommendations as string[],
    projectName: project.name,
  };
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: ProvidersService,
    private readonly projects: ProjectsService,
  ) {}

  /**
   * Which files a review would read. Shared by run() and plan(), so the number shown
   * before a review is exactly what will be sent.
   */
  private async selectFiles(
    userId: string,
    projectId: string,
    scope: RunReviewDto['scope'],
    filePaths: string[],
  ) {
    await this.projects.findOwned(userId, projectId);
    if (scope !== 'PROJECT' && filePaths.length === 0)
      throw new BadRequestException('Pick at least one file.');

    // Never trust paths from the browser: only files stored in this project are read.
    const files = await this.prisma.file.findMany({
      where:
        scope === 'PROJECT'
          ? { projectId }
          : { projectId, path: { in: filePaths } },
      orderBy: { path: 'asc' },
      select: { path: true, content: true, sensitive: true },
    });
    // Sensitive files (env, keys…) are never sent: only their paths, as a hint.
    const readable = files.filter((file) => !file.sensitive);
    const hiddenPaths = files
      .filter((file) => file.sensitive)
      .map((file) => file.path);
    if (readable.length === 0)
      throw new BadRequestException(
        files.length
          ? 'These files are hidden for privacy (they usually hold secrets), so they are not reviewed.'
          : 'None of these files are in the project.',
      );
    const { included, skipped } = pickFiles(rankForReview(readable));
    return { readable, hiddenPaths, included, skipped };
  }

  /** Before a whole-project review: how many files fit the model's budget. */
  async plan(
    userId: string,
    projectId: string,
  ): Promise<{ total: number; fits: number; hidden: number }> {
    const { readable, included, hiddenPaths } = await this.selectFiles(
      userId,
      projectId,
      'PROJECT',
      [],
    );
    return {
      total: readable.length,
      fits: included.length,
      hidden: hiddenPaths.length,
    };
  }

  async run(
    userId: string,
    projectId: string,
    dto: RunReviewDto,
  ): Promise<ReviewView> {
    const { included, skipped, hiddenPaths } = await this.selectFiles(
      userId,
      projectId,
      dto.scope,
      dto.filePaths,
    );
    const { provider, output } = await this.providers.useProvider(
      userId,
      async (provider) => ({
        provider,
        output: await this.ask(provider, dto.mode, included, hiddenPaths),
      }),
    );
    const summary = skipped
      ? `${output.summary} (${skipped} file${skipped === 1 ? ' was' : 's were'} left out to fit the model's context.)`
      : output.summary;

    const row = await this.prisma.review.create({
      data: {
        projectId,
        mode: dto.mode,
        scope:
          dto.scope === 'PROJECT'
            ? 'PROJECT'
            : included.length === 1
              ? 'FILE'
              : 'FILES',
        filePaths: included.map((file) => file.path),
        summary,
        issues: output.issues as unknown as Prisma.InputJsonValue,
        recommendations: output.recommendations,
        highestSeverity: highestSeverity(output.issues),
        providerName: provider.name,
        model: provider.model,
      },
      select: reviewSelect,
    });
    return toView(row);
  }

  // Search runs over summary, project name, file paths and issue titles.
  // ponytail: text search in memory over the user's reviews; move to Postgres
  // full-text search (tsvector) if one user ever has thousands of reviews.
  async list(userId: string, query: ListReviewsQuery): Promise<ReviewView[]> {
    const rows = await this.prisma.review.findMany({
      where: {
        project: { userId },
        ...(query.mode && { mode: query.mode }),
        ...(query.severity && { highestSeverity: query.severity }),
        ...(query.projectId && { projectId: query.projectId }),
      },
      orderBy: { createdAt: 'desc' },
      select: reviewSelect,
    });
    const reviews = rows.map(toView);
    const q = query.q?.toLowerCase();
    if (!q) return reviews;
    return reviews.filter((review) =>
      [
        review.summary,
        review.projectName,
        ...review.filePaths,
        ...review.issues.map((issue) => issue.title),
      ].some((text) => text.toLowerCase().includes(q)),
    );
  }

  async get(userId: string, id: string): Promise<ReviewView> {
    const row = await this.prisma.review.findFirst({
      where: { id, project: { userId } },
      select: reviewSelect,
    });
    if (!row) throw new NotFoundException('Review not found');
    return toView(row);
  }

  /** Calls the model; retries once with the validation error if the JSON is bad. */
  private async ask(
    provider: ActiveProvider,
    mode: ReviewMode,
    files: SourceFile[],
    hiddenPaths: string[],
  ): Promise<ReviewOutput> {
    const client = providerClient(
      provider.baseUrl,
      provider.apiKey,
      REVIEW_TIMEOUT_MS,
    );
    const messages: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }[] = buildReviewMessages(mode, files, hiddenPaths);
    const deadline = Date.now() + REVIEW_TIMEOUT_MS;

    for (let attempt = 1; ; attempt++) {
      // No temperature: some models (e.g. OpenAI reasoning models) reject anything but
      // the default. SDK errors bubble up to useProvider(), which turns them into a 502.
      const completion = await client.chat.completions.create(
        { model: provider.model, messages },
        { timeout: deadline - Date.now() },
      );
      const text = completion.choices[0]?.message?.content ?? '';
      try {
        return parseReviewOutput(text, files);
      } catch (error) {
        if (attempt === 2 || deadline - Date.now() < MIN_RETRY_MS)
          throw new BadGatewayException(
            'The model did not return a valid review. Try again, or use a larger model.',
          );
        const reason = error instanceof Error ? error.message : 'invalid JSON';
        messages.push(
          { role: 'assistant', content: text },
          {
            role: 'user',
            content: `That reply was not valid (${reason}). Reply again with only the JSON object, in exactly the shape asked.`,
          },
        );
      }
    }
  }
}
