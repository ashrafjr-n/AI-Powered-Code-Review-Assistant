import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { extractZip, InvalidZipError } from './unzip.js';

export interface FileEntry {
  path: string;
  size: number;
}

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

  /** A new upload replaces all files of the project. Returns the new file count. */
  async upload(
    userId: string,
    projectId: string,
    zip: Uint8Array,
  ): Promise<{ fileCount: number }> {
    await this.assertOwner(userId, projectId);
    let files;
    try {
      files = extractZip(zip);
    } catch (error) {
      if (error instanceof InvalidZipError)
        throw new BadRequestException(error.message);
      throw error;
    }
    // One transaction: a failed insert keeps the old files.
    await this.prisma.$transaction([
      this.prisma.file.deleteMany({ where: { projectId } }),
      this.prisma.file.createMany({
        data: files.map((file) => ({ ...file, projectId })),
      }),
    ]);
    return { fileCount: files.length };
  }

  /** Paths and sizes only: the tree never needs file content. */
  async list(userId: string, projectId: string): Promise<FileEntry[]> {
    await this.assertOwner(userId, projectId);
    return this.prisma.file.findMany({
      where: { projectId },
      orderBy: { path: 'asc' },
      select: { path: true, size: true },
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
      select: { path: true, size: true, content: true },
    });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }
}
