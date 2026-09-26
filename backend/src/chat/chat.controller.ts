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
import { askSchema, type AskDto } from './chat.schemas.js';
import { ChatService, type ChatSessionView } from './chat.service.js';

@Controller('projects/:id/chats')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  list(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<ChatSessionView[]> {
    return this.chat.listSessions(userId, id);
  }

  // Waits for the model's answer.
  @Post('messages')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  ask(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body({ schema: askSchema }) dto: AskDto,
  ): Promise<{ sessionId: string }> {
    return this.chat.ask(userId, id, dto);
  }
}
