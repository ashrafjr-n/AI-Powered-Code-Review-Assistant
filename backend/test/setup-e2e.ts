import 'dotenv/config'; // the e2e app boots Prisma, which needs DATABASE_URL

// Tests must not depend on the developer's demo model in .env.
// The demo test file sets its own DEMO_* values.
for (const name of Object.keys(process.env))
  if (name.startsWith('DEMO_')) delete process.env[name];
