import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import {
  createProjectSchema,
  type CreateProjectDto,
} from './projects.schemas.js';
import { ProjectsService, type ProjectSummary } from './projects.service.js';

// All routes need login (global AuthGuard) and only touch the caller's projects.
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@CurrentUserId() userId: string): Promise<ProjectSummary[]> {
    return this.projects.list(userId);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body({ schema: createProjectSchema }) dto: CreateProjectDto,
  ): Promise<ProjectSummary> {
    return this.projects.create(userId, dto);
  }

  @Get(':id')
  get(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<ProjectSummary> {
    return this.projects.get(userId, id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<void> {
    return this.projects.remove(userId, id);
  }
}
