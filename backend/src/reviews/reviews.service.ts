import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, ReviewMode } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  describeProviderError,
  providerClient,
  ProviderError,
} from '../providers/provider-client.js';
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
  ) {}

  async run(
    userId: string,
    projectId: string,
    dto: RunReviewDto,
  ): Promise<ReviewView> {
    const owned = await this.prisma.project.count({
      where: { id: projectId, userId },
    });
    if (owned === 0) throw new NotFoundException('Project not found');
    if (dto.scope !== 'PROJECT' && dto.filePaths.length === 0)
      throw new BadRequestException('Pick at least one file.');

    // Never trust paths from the browser: only files stored in this project are read.
    const files = await this.prisma.file.findMany({
      where:
        dto.scope === 'PROJECT'
          ? { projectId }
          : { projectId, path: { in: dto.filePaths } },
      orderBy: { path: 'asc' },
      select: { path: true, content: true },
    });
    if (files.length === 0)
      throw new BadRequestException('None of these files are in the project.');

    const provider = await this.providers.getActive(userId);
    const { included, skipped } = pickFiles(files);
    const output = await this.ask(provider, dto.mode, included);
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
  ): Promise<ReviewOutput> {
    try {
      await this.providers.assertCallable(provider.baseUrl);
    } catch (error) {
      if (error instanceof ProviderError)
        throw new BadRequestException(error.message);
      throw error;
    }
    const client = providerClient(
      provider.baseUrl,
      provider.apiKey,
      REVIEW_TIMEOUT_MS,
    );
    const messages: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }[] = buildReviewMessages(mode, files);
    const deadline = Date.now() + REVIEW_TIMEOUT_MS;

    for (let attempt = 1; ; attempt++) {
      let text: string;
      try {
        // No temperature: some models (e.g. OpenAI reasoning models) reject anything but the default.
        const completion = await client.chat.completions.create(
          { model: provider.model, messages },
          { timeout: deadline - Date.now() },
        );
        text = completion.choices[0]?.message?.content ?? '';
      } catch (error) {
        throw new BadGatewayException(describeProviderError(error));
      }
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
