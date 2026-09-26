import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// All routes need login by default (global AuthGuard). Mark exceptions with @Public().
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
