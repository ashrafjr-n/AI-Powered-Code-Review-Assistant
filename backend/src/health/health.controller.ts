import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';

// Used by the hosting platform (Render) to check the app is alive.
@Public()
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
