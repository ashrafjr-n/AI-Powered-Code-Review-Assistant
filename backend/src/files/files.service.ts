import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { extractZip, InvalidZipError, type SkipCounts } from './unzip.js';

export interface FileEntry {
  path: string;
  size: number;
  sensitive: boolean;
}

/**
 * Saved on the project after each upload (shown under the file tree).
 * A `type`, not an `interface`: Prisma's JSON input only accepts types.
 */
export type UploadStats = {
  kept: number;
  sensitive: number;
  skipped: SkipCounts;
  redacted: number;
};

export interface FileWithContent extends FileEntry {
  content: string;
}

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  // Same rule as ProjectsService: another user's project is simply "not found".
  private async assertOwner(userId: string, projectId: string): Promise<void> {
    const count = await this.prisma.project.count({
      where: { id: projectId, userId },
    });
    if (count === 0) throw new NotFoundException('Project not found');
  }

  /**
   * A new upload replaces all files of the project.
   * `clientSkipped` = what the browser already removed before upload (informational,
   * added to what the server skipped).
   */
  async upload(
    userId: string,
    projectId: string,
    zip: Uint8Array,
    clientSkipped: SkipCounts,
  ): Promise<UploadStats> {
    await this.assertOwner(userId, projectId);
    let result;
    try {
      result = extractZip(zip);
    } catch (error) {
      if (error instanceof InvalidZipError)
        throw new BadRequestException(error.message);
      throw error;
    }
    const sensitive = result.files.filter((file) => file.sensitive).length;
    const stats: UploadStats = {
      kept: result.files.length - sensitive,
      sensitive,
      skipped: {
        ignored: result.skipped.ignored + clientSkipped.ignored,
        binary: result.skipped.binary + clientSkipped.binary,
        tooLarge: result.skipped.tooLarge + clientSkipped.tooLarge,
      },
      redacted: result.redacted,
    };
    // One transaction: a failed insert keeps the old files.
    await this.prisma.$transaction([
      this.prisma.file.deleteMany({ where: { projectId } }),
      this.prisma.file.createMany({
        data: result.files.map((file) => ({ ...file, projectId })),
      }),
      this.prisma.project.update({
        where: { id: projectId },
        data: { uploadStats: stats },
      }),
    ]);
    return stats;
  }

  /** Paths and sizes only: the tree never needs file content. */
  async list(userId: string, projectId: string): Promise<FileEntry[]> {
    await this.assertOwner(userId, projectId);
    return this.prisma.file.findMany({
      where: { projectId },
      orderBy: { path: 'asc' },
      select: { path: true, size: true, sensitive: true },
    });
  }

  async content(
    userId: string,
    projectId: string,
    path: string,
  ): Promise<FileWithContent> {
    await this.assertOwner(userId, projectId);
    const file = await this.prisma.file.findUnique({
      where: { projectId_path: { projectId, path } },
      select: { path: true, size: true, content: true, sensitive: true },
    });
    if (!file) throw new NotFoundException('File not found');
    if (file.sensitive)
      throw new ForbiddenException({
        statusCode: 403,
        code: 'SENSITIVE_FILE',
        message:
          'This file usually holds secrets, so Redline never stores, opens or sends it.',
      });
    return file;
  }
}
