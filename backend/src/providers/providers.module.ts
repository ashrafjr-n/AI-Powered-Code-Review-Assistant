import { Module } from '@nestjs/common';
import { ProvidersController } from './providers.controller.js';
import { DemoService } from './demo.service.js';
import { ProvidersService } from './providers.service.js';

@Module({
  controllers: [ProvidersController],
  providers: [ProvidersService, DemoService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
