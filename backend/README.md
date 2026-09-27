# Redline — backend

NestJS API for Redline: auth, projects, ZIP uploads, AI code reviews, chat with code, generated docs and model providers. PostgreSQL through Prisma. Every route lives under `/api`.

The browser never calls this server directly: the Next.js app calls it from its own server (see [../ARCHITECTURE.md](../ARCHITECTURE.md)).

## Stack
- NestJS 12 (ESM, strict TypeScript), Express
- Prisma 7.10 (pinned) + `@prisma/adapter-pg`, PostgreSQL 17
- Zod for request validation (`@Body({ schema })` + `StandardSchemaValidationPipe`)
- Official `openai` SDK with a configurable base URL (OpenAI, Gemini, Groq, OpenRouter, Ollama, LM Studio…)
- Vitest (unit + e2e), oxlint

## Run locally
Needs Node 22 and Docker.

```bash
# from the repo root: start Postgres (host port 5433)
cp .env.example .env
npm run db

# backend
cd backend
cp .env.example .env        # then fill JWT_SECRET and ENCRYPTION_KEY (see below)
npx -y npm@11 install       # npm 10.9 crashes on this project (npm bug), npm 11 works
npx prisma migrate deploy
npm run start:dev           # http://localhost:4000/api/health
```

`npm run dev` in the repo root starts the database, this backend and the frontend together.

## Environment
See [.env.example](.env.example) for every variable with a comment.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `JWT_SECRET` | yes | `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | yes | 64 hex characters: `openssl rand -hex 32`. Encrypts stored API keys (AES-256-GCM) |
| `BFF_SECRET` | production | Same value as in the frontend. Lets the Next.js server pass the user's IP (`X-Client-IP`) for rate limits. `openssl rand -hex 32` |
| `NODE_ENV` | production | `production` = login cookie is HTTPS only |
| `ALLOW_LOCAL_PROVIDERS` | dev only | `true` allows models on localhost/private networks. **Never set it on a public server** (SSRF protection) |
| `DEMO_*` | optional | Built-in free demo model (any OpenAI-compatible API) and its daily limits; `DEMO_MAX_CHARS` = review size for this large-context model (default 160,000). Empty `DEMO_BASE_URL` = demo off |
| `PORT` | optional | Default 4000 |

## Scripts
| Command | What it does |
|---|---|
| `npm run start:dev` | Dev server with watch |
| `npm run build` / `npm run start:prod` | Build to `dist/` / run it |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests against the local database (a fake model server, no real AI calls) |
| `npm run lint` | oxlint (type-aware) |

## Modules (`src/`)
| Module | Routes | Job |
|---|---|---|
| `auth` | `POST /auth/register`, `/login`, `/logout`, `GET /auth/me` | scrypt passwords, JWT in an httpOnly cookie. A global guard protects every route; open ones use `@Public()`. Rate limits per user (`UserThrottlerGuard`) and failed-login lock per account (`LoginAttempts`) |
| `projects` | `GET/POST /projects`, `GET/DELETE /projects/:id` | Every query is scoped to the user; other users' projects answer 404 |
| `files` | `POST/GET /projects/:id/files`, `GET …/files/content?path=` | Unzip in memory with limits (10 uploads a minute), skip junk, keep secret files by path only, redact inline secrets |
| `providers` | `/providers` (list, add, edit, delete, set main, test), `/providers/options`, `/providers/demo` | Encrypted API keys, SSRF guard, the demo model with daily limits. `useProvider()` is the one gate for every AI call |
| `reviews` | `POST /projects/:id/reviews`, `GET …/reviews/plan`, `GET /reviews` (paged, filters `q`, `mode`, `severity`, `projectId`, `file`, `codeVersion`), `GET /reviews/:id` | Prompt, context budget, JSON output checked with Zod (1 retry), paths/lines matched to real files. Scope `DIFF` = review only the change between two files (`review-diff.ts`, jsdiff) |
| `chat` | `GET /projects/:id/chats` (titles), `GET …/chats/:sessionId` (messages), `POST …/chats/messages` | `pickSources()`: the open file first, then keyword matches, else the previous answer's files (max 3 = sources); last 6 messages as history |
| `insights` | `GET/POST /projects/:id/insights` | Architecture overview, README, setup guide, API docs. One saved document per kind |
| `health` | `GET /health` | For the host's health check |

## Deploy (Render)
| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build command | `npx -y npm@11 ci --include=dev && npx prisma migrate deploy && npm run build` |
| Start command | `node dist/main` |
| Health check | `/api/health` |

Set `NODE_ENV=production`, fresh `JWT_SECRET`, `ENCRYPTION_KEY` and `BFF_SECRET` (the same `BFF_SECRET` on Vercel), and the database URL. Don't set `ALLOW_LOCAL_PROVIDERS`. `trust proxy` is set to one hop in `src/main.ts`.
