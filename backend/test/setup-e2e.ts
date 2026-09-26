import 'dotenv/config'; // the e2e app boots Prisma, which needs DATABASE_URL

// Tests must not depend on the developer's demo model in .env.
// The demo test file sets its own DEMO_* values.
for (const name of Object.keys(process.env))
  if (name.startsWith('DEMO_')) delete process.env[name];

// A known shared secret, so tests can act as the Next.js server (X-Client-IP).
process.env.BFF_SECRET = 'e2e-bff-secret';
