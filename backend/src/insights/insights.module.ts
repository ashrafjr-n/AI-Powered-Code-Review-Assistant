import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module.js';
import { InsightsController } from './insights.controller.js';
import { InsightsService } from './insights.service.js';

@Module({
  imports: [ProvidersModule],
  controllers: [InsightsController],
  providers: [InsightsService],
})
export class InsightsModule {}
