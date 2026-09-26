// MOCK (frontend-only phase). One in-memory "database" for all mock modules.
// It lives in the server process and resets when the dev server restarts.
// Replaced piece by piece by the NestJS API in C1–C7, then this folder is deleted.
import type {
  AiProvider,
  ChatSession,
  Insight,
  ProjectFile,
  Review,
} from "@/lib/types";
import { crmFiles, lineOf, portfolioFiles } from "./sample-code";

export const db = {
  files: new Map<string, ProjectFile[]>(),

  reviews: [] as Review[],

  // Issue templates the mock review engine picks from (matched by lens + file path).
  reviewTemplates: [
    {
      id: "r-crm-security",
      projectId: "p-crm",
      mode: "SECURITY",
      scope: "PROJECT",
      filePaths: crmFiles.map((file) => file.path),
      summary:
        "A small Express API for contacts and invoices. Authentication is mostly solid, but a live payment key is committed to the repository and one query is built from raw user input. Fix those two before the next deploy.",
      issues: [
        {
          title: "Live Stripe secret key in source code",
          description:
            "The key is committed in plain text, so anyone with repository access can charge cards. Move it to an environment variable and rotate the key, because it is already in git history.",
          severity: "CRITICAL",
          filePath: "src/config/payments.ts",
          line: lineOf(crmFiles, "src/config/payments.ts", "sk_live"),
        },
        {
          title: "SQL query built by string concatenation",
          description:
            "The search parameter is joined into the query string, which allows SQL injection. Use a parameterized query ($1) like the route above it.",
          severity: "HIGH",
          filePath: "src/routes/users.ts",
          line: lineOf(crmFiles, "src/routes/users.ts", "LIKE '%"),
        },
        {
          title: "Password reset tokens never expire",
          description:
            "A leaked reset link works forever, and tokens are not deleted after use. Store an expiry time and delete the token after a reset.",
          severity: "HIGH",
          filePath: "src/auth/reset-password.ts",
          line: lineOf(
            crmFiles,
            "src/auth/reset-password.ts",
            "FROM reset_tokens",
          ),
        },
        {
          title: "No rate limit on the login route",
          description:
            "Unlimited attempts make password guessing cheap. Limit requests per IP and per account.",
          severity: "MEDIUM",
          filePath: "src/routes/auth.ts",
          line: lineOf(crmFiles, "src/routes/auth.ts", 'post("/login"'),
        },
        {
          title: "Stack traces returned to clients",
          description:
            "Error responses include err.stack with internal file paths. Return a generic message and log the details instead.",
          severity: "LOW",
          filePath: "src/middleware/errors.ts",
          line: lineOf(
            crmFiles,
            "src/middleware/errors.ts",
            "stack: err.stack",
          ),
        },
      ],
      recommendations: [
        "Rotate the Stripe key today, then load secrets only from environment variables.",
        "Use parameterized queries everywhere user input reaches the database.",
        "Add expiry to every one-time token and delete it after use.",
        "Put a rate limiter in front of all authentication routes.",
      ],
      providerName: "LM Studio",
      model: "qwen2.5-coder-14b",
      createdAt: "2026-09-26T09:14:00.000Z",
    },
    {
      id: "r-crm-performance",
      projectId: "p-crm",
      mode: "PERFORMANCE",
      scope: "FILES",
      filePaths: ["src/services/invoices.ts", "src/db/pool.ts"],
      summary:
        "Invoice listing runs one extra query per invoice (N+1). With a few thousand invoices this becomes thousands of round trips. The pool setup itself is fine.",
      issues: [
        {
          title: "N+1 queries when loading customers",
          description:
            "Each invoice triggers its own customer query inside the loop. Load all customers in one query with a JOIN or WHERE id = ANY($1).",
          severity: "HIGH",
          filePath: "src/services/invoices.ts",
          line: lineOf(
            crmFiles,
            "src/services/invoices.ts",
            "for (const invoice",
          ),
        },
        {
          title: "SELECT * on the invoices table",
          description:
            "Selecting every column loads data the API never returns. List the needed columns.",
          severity: "LOW",
          filePath: "src/services/invoices.ts",
          line: lineOf(crmFiles, "src/services/invoices.ts", "SELECT *"),
        },
      ],
      recommendations: [
        "Replace the loop with one JOIN query.",
        "Add pagination to the invoice list endpoint.",
      ],
      providerName: "OpenAI",
      model: "gpt-5-mini",
      createdAt: "2026-09-25T16:40:00.000Z",
    },
    {
      id: "r-portfolio-quality",
      projectId: "p-portfolio",
      mode: "QUALITY",
      scope: "PROJECT",
      filePaths: portfolioFiles.map((file) => file.path),
      summary:
        "Small, readable codebase. The home page mixes data logic into JSX, and the contact action trusts form input without checks.",
      issues: [
        {
          title: "Filtering and sorting inside JSX",
          description:
            "Move the published filter and date sort above the return (or into a helper) so the markup only renders.",
          severity: "MEDIUM",
          filePath: "src/app/page.tsx",
          line: lineOf(portfolioFiles, "src/app/page.tsx", ".filter("),
        },
        {
          title: "Array index used as list key",
          description:
            "The list is filtered and sorted, so index keys can attach state to the wrong item. Use the post title or an id.",
          severity: "LOW",
          filePath: "src/app/page.tsx",
          line: lineOf(portfolioFiles, "src/app/page.tsx", "key={index}"),
        },
        {
          title: "Contact form input is not validated",
          description:
            "Email and message go straight to the mail API. Check they exist and have a sane length on the server.",
          severity: "MEDIUM",
          filePath: "src/app/contact/actions.ts",
          line: lineOf(
            portfolioFiles,
            "src/app/contact/actions.ts",
            'formData.get("email")',
          ),
        },
      ],
      recommendations: [
        "Keep components free of data logic.",
        "Validate every Server Action input on the server.",
      ],
      providerName: "LM Studio",
      model: "qwen2.5-coder-14b",
      createdAt: "2026-09-25T18:30:00.000Z",
    },
  ] as Review[],

  chats: [] as ChatSession[],

  insights: new Map<string, Insight[]>(),

  providers: [
    {
      id: "prov-lmstudio",
      name: "LM Studio",
      baseUrl: "http://localhost:1234/v1",
      model: "qwen2.5-coder-14b",
      hasApiKey: false,
      isDefault: true,
    },
    {
      id: "prov-openai",
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-5-mini",
      hasApiKey: true,
      isDefault: false,
    },
  ] as AiProvider[],
};

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
