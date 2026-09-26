import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import {
  generateInsightSchema,
  type GenerateInsightDto,
} from './insights.schemas.js';
import { InsightsService, type InsightView } from './insights.service.js';

// Bonus features: architecture overview + documentation generator.
@Controller('projects/:id/insights')
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}

  @Get()
  list(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<InsightView[]> {
    return this.insights.list(userId, id);
  }

  // Waits for the model.
  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  generate(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body({ schema: generateInsightSchema }) dto: GenerateInsightDto,
  ): Promise<InsightView> {
    return this.insights.generate(userId, id, dto.kind);
  }
}
