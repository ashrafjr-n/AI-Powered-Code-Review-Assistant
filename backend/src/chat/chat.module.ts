import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';

@Module({
  imports: [ProjectsModule, ProvidersModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
