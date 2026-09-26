import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { InsightsController } from './insights.controller.js';
import { InsightsService } from './insights.service.js';

@Module({
  imports: [ProjectsModule, ProvidersModule],
  controllers: [InsightsController],
  providers: [InsightsService],
})
export class InsightsModule {}
