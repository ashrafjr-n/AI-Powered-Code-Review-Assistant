import type { Review } from "@/lib/types";

// A realistic example review, shown on the landing page as "what you get".
// Static marketing content, not mock data: it stays after the app is connected.
export const sampleReview: Review = {
  id: "sample",
  mode: "SECURITY",
  scope: "PROJECT",
  filePaths: [
    "src/config/payments.ts",
    "src/routes/users.ts",
    "src/auth/reset-password.ts",
    "src/routes/auth.ts",
    "src/middleware/errors.ts",
  ],
  summary:
    "A small Express API for orders and payments. Authentication is mostly solid, but a live payment key is committed to the repository and one query is built from raw user input. Fix those two before the next deploy; the rest can follow in a normal sprint.",
  issues: [
    {
      title: "Live Stripe secret key in source code",
      description:
        "The key is committed in plain text, so anyone with repository access can charge cards. Move it to an environment variable and rotate the key, because it is already in git history.",
      severity: "CRITICAL",
      filePath: "src/config/payments.ts",
      line: 4,
    },
    {
      title: "SQL query built by string concatenation",
      description:
        "The search parameter is joined into the query string, which allows SQL injection. Use a parameterized query.",
      severity: "HIGH",
      filePath: "src/routes/users.ts",
      line: 27,
    },
    {
      title: "Password reset tokens never expire",
      description:
        "A leaked reset link works forever. Store an expiry time and reject tokens older than 30 minutes.",
      severity: "HIGH",
      filePath: "src/auth/reset-password.ts",
      line: 41,
    },
    {
      title: "No rate limit on the login route",
      description:
        "Unlimited attempts make password guessing cheap. Limit requests per IP and per account.",
      severity: "MEDIUM",
      filePath: "src/routes/auth.ts",
      line: 12,
    },
    {
      title: "Stack traces returned to clients",
      description:
        "Error responses include internal file paths. Return a generic message in production and log the details instead.",
      severity: "LOW",
      filePath: "src/middleware/errors.ts",
      line: 8,
    },
  ],
  recommendations: [
    "Rotate the Stripe key today, then load secrets only from environment variables.",
    "Use parameterized queries everywhere user input reaches the database.",
    "Add expiry to every one-time token (reset, invite, email change).",
    "Put a rate limiter in front of all authentication routes.",
  ],
  providerName: "LM Studio",
  model: "qwen2.5-coder-14b",
  createdAt: "2026-09-26T09:14:00.000Z",
};
