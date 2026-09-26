import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, Severity } from '../generated/prisma/client.js';
import type { UploadStats } from '../files/files.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateProjectDto } from './projects.schemas.js';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  fileCount: number;
  /** Last upload: kept / skipped / hidden counts (null before the first upload). */
  uploadStats: UploadStats | null;
  lastReview?: {
    severity: Severity | null;
    createdAt: Date;
    /** Issues per severity, for the small blocks on project cards. */
    counts: Record<Severity, number>;
  };
}

// Everything the list/detail views need, in one query per call.
const summarySelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  uploadStats: true,
  // Readable files only: sensitive ones are listed but never opened.
  _count: { select: { files: { where: { sensitive: false } } } },
  reviews: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: { highestSeverity: true, createdAt: true, issues: true },
  },
} satisfies Prisma.ProjectSelect;

type SummaryRow = Prisma.ProjectGetPayload<{ select: typeof summarySelect }>;

function countIssues(issues: Prisma.JsonValue): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  // Written by the review engine after Zod validation: an array of { severity }.
  for (const issue of issues as { severity: Severity }[])
    counts[issue.severity]++;
  return counts;
}

function toSummary(row: SummaryRow): ProjectSummary {
  const latest = row.reviews[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    fileCount: row._count.files,
    uploadStats: row.uploadStats as UploadStats | null,
    lastReview: latest
      ? {
          severity: latest.highestSeverity,
          createdAt: latest.createdAt,
          counts: countIssues(latest.issues),
        }
      : undefined,
  };
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<ProjectSummary[]> {
    const rows = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: summarySelect,
    });
    return rows.map(toSummary);
  }

  // Every lookup filters by userId too: another user's project is simply "not found".
  async get(userId: string, id: string): Promise<ProjectSummary> {
    const row = await this.prisma.project.findFirst({
      where: { id, userId },
      select: summarySelect,
    });
    if (!row) throw new NotFoundException('Project not found');
    return toSummary(row);
  }

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectSummary> {
    const row = await this.prisma.project.create({
      data: { ...dto, userId },
      select: summarySelect,
    });
    return toSummary(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    // Files, reviews and chats are removed by the database (onDelete: Cascade).
    const { count } = await this.prisma.project.deleteMany({
      where: { id, userId },
    });
    if (count === 0) throw new NotFoundException('Project not found');
  }
}
