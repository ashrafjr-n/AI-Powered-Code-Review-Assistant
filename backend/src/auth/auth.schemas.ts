import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const registerSchema = z.object({
  email,
  // Max length stops very long inputs from making hashing slow (DoS).
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(100),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
