import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import {
  providerInputSchema,
  testConnectionSchema,
  type ProviderInput,
  type TestConnectionInput,
} from './providers.schemas.js';
import {
  ProvidersService,
  type ConnectionResult,
  type ProviderView,
} from './providers.service.js';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get()
  list(@CurrentUserId() userId: string): Promise<ProviderView[]> {
    return this.providers.list(userId);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body({ schema: providerInputSchema }) input: ProviderInput,
  ): Promise<ProviderView> {
    return this.providers.create(userId, input);
  }

  // The server calls a user-chosen URL here, so keep it slow to abuse.
  @Post('test')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  test(
    @CurrentUserId() userId: string,
    @Body({ schema: testConnectionSchema }) input: TestConnectionInput,
  ): Promise<ConnectionResult> {
    return this.providers.testConnection(userId, input);
  }

  @Put(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body({ schema: providerInputSchema }) input: ProviderInput,
  ): Promise<ProviderView> {
    return this.providers.update(userId, id, input);
  }

  @Post(':id/default')
  @HttpCode(204)
  setDefault(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<void> {
    return this.providers.setDefault(userId, id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<void> {
    return this.providers.remove(userId, id);
  }
}
