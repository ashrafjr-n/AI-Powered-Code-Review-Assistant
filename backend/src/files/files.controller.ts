import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import {
  fileContentQuerySchema,
  type FileContentQuery,
} from './files.schemas.js';
import {
  FilesService,
  type FileEntry,
  type FileWithContent,
} from './files.service.js';
import { MAX_ZIP_BYTES } from './unzip.js';

// The part of a multer file we use (avoids adding @types/multer for one shape).
interface UploadedZip {
  buffer: Buffer;
}

@Controller('projects/:id/files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  // multipart/form-data with one "file" field. Kept in memory (max 10 MB), never on disk.
  // Multer answers 413 by itself when the file is too large.
  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_ZIP_BYTES, files: 1 } }),
  )
  upload(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @UploadedFile() file: UploadedZip | undefined,
  ): Promise<{ fileCount: number }> {
    if (!file) throw new BadRequestException('Attach a .zip file.');
    return this.files.upload(userId, id, file.buffer);
  }

  @Get()
  list(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<FileEntry[]> {
    return this.files.list(userId, id);
  }

  // Path in the query string, because paths contain slashes.
  @Get('content')
  content(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Query({ schema: fileContentQuerySchema }) query: FileContentQuery,
  ): Promise<FileWithContent> {
    return this.files.content(userId, id, query.path);
  }
}
