import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import {
  listReviewsQuerySchema,
  runReviewSchema,
  type ListReviewsQuery,
  type RunReviewDto,
} from './reviews.schemas.js';
import { ReviewsService, type ReviewView } from './reviews.service.js';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  // Waits for the model (can take minutes on a local CPU model).
  @Post('projects/:id/reviews')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  run(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body({ schema: runReviewSchema }) dto: RunReviewDto,
  ): Promise<ReviewView> {
    return this.reviews.run(userId, id, dto);
  }

  /** How many files a whole-project review would send (shown before running it). */
  @Get('projects/:id/reviews/plan')
  plan(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ total: number; fits: number; hidden: number }> {
    return this.reviews.plan(userId, id);
  }

  @Get('reviews')
  list(
    @CurrentUserId() userId: string,
    @Query({ schema: listReviewsQuerySchema }) query: ListReviewsQuery,
  ): Promise<ReviewView[]> {
    return this.reviews.list(userId, query);
  }

  @Get('reviews/:id')
  get(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<ReviewView> {
    return this.reviews.get(userId, id);
  }
}
