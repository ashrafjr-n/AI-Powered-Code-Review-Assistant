<div align="center">

<a href="https://redline-tau-eight.vercel.app">
  <img src="docs/readme/hero.png" alt="Redline landing page: Code review, on your terms." width="100%">
</a>

# Redline

**AI code review, on your terms.**<br>
Upload a project, pick a Security, Performance or Quality lens, and get a structured report with severities, file paths and line numbers.<br>
Then ask questions about the code, compare two files, or generate its docs. Works with any OpenAI-compatible model, in the cloud or on your own computer.

[![Live demo](https://img.shields.io/badge/Live_demo-redline--tau--eight.vercel.app-e5484d?style=for-the-badge)](https://redline-tau-eight.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js_16-07080a?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-07080a?style=flat-square&logo=react&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS_12-07080a?style=flat-square&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_17-07080a?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-07080a?style=flat-square&logo=prisma&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-07080a?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-07080a?style=flat-square&logo=tailwindcss&logoColor=white)

[Live demo](https://redline-tau-eight.vercel.app) · [Architecture](ARCHITECTURE.md) · [Audit](AUDIT.md) · [AI usage](AI_USAGE.md) · [Backend](backend/README.md) · [Frontend](frontend/README.md)

</div>

---

## Contents

- [Try it](#try-it)
- [Features](#features)
- [See it in action](#see-it-in-action)
- [Tech stack](#tech-stack)
- [Architecture overview](#architecture-overview)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Local models: LM Studio and Ollama](#local-models-lm-studio-and-ollama)
- [Scripts and tests](#scripts-and-tests)
- [Deployment](#deployment)
- [Security and privacy](#security-and-privacy)
- [Limits](#limits)
- [Notes](#notes)
- [Project docs](#project-docs)

## Try it

Open **[redline-tau-eight.vercel.app](https://redline-tau-eight.vercel.app)**, create an account and upload a project. You don't need an API key: a free demo model is built in.

> [!TIP]
> Each account gets **10 free demo requests a day** (a review, a chat question or a generated doc counts as one). For more, add your own model in **Settings**: OpenAI, Gemini, Groq, OpenRouter, or any OpenAI-compatible API.

> [!WARNING]
> Demo requests go to Google Gemini's free tier, which may use them to improve Google's products. **Don't upload private code with the demo model.** With your own provider, your code only goes to the URL you set.

## Features

Every requirement of the assessment brief, and where to find it:

| Brief | In Redline |
|---|---|
| **Authentication** | Register, login, logout. JWT in an httpOnly cookie. Every API route is protected by default, and pages redirect to login |
| **Project management** | Create, view and delete projects (name, description, creation date) |
| **Code upload** | **ZIP upload** (option A) and **drag and drop of files or whole folders** (option B). The browser drops `node_modules`, build output and binaries first, so only source code is sent |
| **Code explorer** | Folder tree, file preview and syntax highlighting (Shiki). Issue dots in the gutter, and links jump to the exact line |
| **AI review engine** | Review **one file, selected files or the whole project**. The report has a summary, issues, recommendations and severity (**Critical, High, Medium, Low**) |
| **Review templates** | Three lenses: **Security**, **Performance** and **Code Quality** |
| **Review history** | Every review is saved. Search summaries, issues and file paths, filter by lens, worst severity and project, 20 per page, and open the full report |
| **AI chat with code** | Ask questions about the uploaded code. Answers use the open file and the files that match the question, and list their sources |
| **Configurable providers** | Base URL, API key and model are user settings: OpenAI, LM Studio, Ollama, OpenRouter, Gemini, Groq or any OpenAI-compatible endpoint. Nothing is hardcoded |

**Bonus features** (the brief asks for two, Redline has three):

- **Diff Review:** compare two files and review only what changed.
- **Documentation Generator:** README, setup guide and API documentation from the code.
- **Architecture Analysis:** an architecture overview of the project.

**Extras:** a built-in demo model with daily limits, private files kept private (`.env`, keys), secrets in code redacted before saving, "code changed" labels after a new upload, a resizable workspace, and a layout that works on phones.

## See it in action

### 1. Upload a project

Create a project and drop a ZIP, files or a folder. Secret files like `.env` show up with a lock and are never uploaded. Keys written inside code are replaced with `‹redacted›` before anything is saved.

<img src="docs/readme/upload.gif" alt="Creating a project and uploading a ZIP; the file tree appears with a locked .env file and redacted secrets." width="100%">

### 2. Run a review

Pick a lens and a scope. The model's answer is checked and matched to real files and lines, and the report opens a few seconds later.

<img src="docs/readme/review.gif" alt="Running a whole-project security review and scrolling the report with critical issues." width="100%">

### 3. Chat with your code

Ask in plain words. Each answer names the files it read, and one click opens them.

<img src="docs/readme/chat.gif" alt="Asking how login works; the answer explains the SQL injection risk and lists its source files." width="100%">

### 4. Generate the architecture and the docs

One click writes an architecture overview, a README, a setup guide or API docs. The document says which files it was based on.

<img src="docs/readme/insights.gif" alt="Generating an architecture overview that opens in the middle pane." width="100%">

<table>
  <tr>
    <td width="50%"><img src="docs/readme/workspace.png" alt="Workspace: file tree, code with issue dots, review panel."></td>
    <td width="50%"><img src="docs/readme/report.png" alt="Review report: verdict, severity counts, issues grouped by file, recommendations."></td>
  </tr>
  <tr>
    <td align="center"><sub><b>Workspace:</b> tree, highlighted code with issue dots, review panel</sub></td>
    <td align="center"><sub><b>Report:</b> verdict, severity bar, issues by file, recommendations</sub></td>
  </tr>
</table>

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript, Tailwind CSS 4, Shiki, react-markdown, fflate |
| Backend | NestJS 12 (ESM), TypeScript, Zod validation, official `openai` SDK with a configurable base URL, jsdiff |
| Database | PostgreSQL 17 with Prisma 7 (Docker locally, Neon in production) |
| Tests | Vitest (backend unit + e2e with a fake model server), Node's test runner (frontend) |
| Hosting | Vercel (frontend), Render (backend), Neon (database) |

## Architecture overview

```mermaid
flowchart LR
  browser["Browser"]
  next["Next.js 16<br/>pages, Server Actions,<br/>/api rewrite"]
  nest["NestJS 12<br/>REST API under /api"]
  db[("PostgreSQL")]
  models["AI model<br/>(any OpenAI-compatible API)"]

  browser -- "HTML, Server Actions,<br/>ZIP upload" --> next
  next -- "fetch + login cookie" --> nest
  nest -- "Prisma" --> db
  nest -- "openai SDK" --> models
```

- **Backend for frontend:** the browser only talks to the Next.js app. Pages and Server Actions call NestJS from the Next.js server and forward the login cookie. The browser never sees the backend URL or a raw token.
- **Frontend:** pages are async Server Components that read data. Changes are Server Actions that validate on the server and then `revalidatePath`. Workspace state (file, line, tab, chat, open doc) lives in the URL, so every view can be linked.
- **Backend:** one NestJS module per area (`auth`, `projects`, `files`, `providers`, `reviews`, `chat`, `insights`). A global guard protects every route, and a single `findOwned()` check makes sure each project belongs to the caller.
- **AI flow:** every AI call goes through one gate, `useProvider()`. It picks your main model (or the demo), re-checks the URL, counts demo usage and turns errors into clear messages. Review output is **untrusted input**: it is parsed, validated with Zod, retried once if broken, and every file path and line is matched to real files.

Diagrams, the database model, the review flow and the trade-offs are in **[ARCHITECTURE.md](ARCHITECTURE.md)**.

## Setup

**Needs:** Node.js 22+, Docker (for PostgreSQL), and optionally Ollama or LM Studio for local models.

```bash
# 1. Clone
git clone https://github.com/ashrafjr-n/AI-Powered-Code-Review-Assistant.git
cd AI-Powered-Code-Review-Assistant

# 2. Environment files (then fill the secrets, see below)
cp .env.example .env                           # database container
cp backend/.env.example backend/.env           # API
cp frontend/.env.example frontend/.env.local   # web app

# 3. Install
npm install                                    # root: runs both apps together
(cd backend && npx -y npm@11 install)          # npm 10.9 crashes on this project (npm bug); npm 11 works
(cd frontend && npm install)

# 4. Database: start Postgres and create the tables
npm run db
(cd backend && npx prisma migrate deploy)

# 5. Run everything (database + API + web app)
npm run dev
```

Then open **http://localhost:3000**. The API runs on http://localhost:4000/api (health check: `/api/health`).

> [!IMPORTANT]
> Fill `JWT_SECRET` and `ENCRYPTION_KEY` in `backend/.env` before the first start (make each with `openssl rand -hex 32`). The API refuses to start without them.

## Environment variables

Every variable has a comment in its `.env.example` file.

**Root `.env`** (used by `docker-compose.yml`)

| Variable | Example | Notes |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `codereview` / `change-me` / `codereview` | Must match `DATABASE_URL` in the backend |

**`backend/.env`**

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | `postgresql://codereview:change-me@localhost:5433/codereview?schema=public` |
| `JWT_SECRET` | yes | Signs login tokens. `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | yes | 64 hex characters. Encrypts saved API keys (AES-256-GCM). Changing it makes saved keys unreadable |
| `BFF_SECRET` | production | Same value as in the frontend. Lets rate limits count real users, not the Next.js server |
| `ALLOW_LOCAL_PROVIDERS` | dev only | `true` lets the API call models on localhost (LM Studio, Ollama). **Never set it on a public server** (SSRF protection) |
| `NODE_ENV` | production | `production` = the login cookie is HTTPS only |
| `DEMO_BASE_URL`, `DEMO_MODEL`, `DEMO_API_KEY` | optional | The built-in demo model. To use it locally, add a free [Gemini key](https://aistudio.google.com/apikey). Empty `DEMO_BASE_URL` = demo off (add your own model in Settings) |
| `DEMO_DAILY_LIMIT_PER_USER`, `DEMO_DAILY_LIMIT_TOTAL`, `DEMO_MAX_CHARS` | optional | Demo limits (defaults 10, 200 and 160,000 characters per review) |
| `PORT` | optional | Default `4000` |

**`frontend/.env.local`**

| Variable | Required | Notes |
|---|---|---|
| `BACKEND_URL` | yes | `http://localhost:4000` (no `/api`). Server-side only |
| `BFF_SECRET` | production | Same value as the backend's |

## Database setup

PostgreSQL 17 runs in Docker on host port **5433**, so it never clashes with a Postgres already installed on port 5432.

```bash
npm run db                                 # start the container and wait until it is healthy
(cd backend && npx prisma migrate deploy)  # create the tables
(cd backend && npx prisma studio)          # optional: browse the data
```

The schema lives in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma). It follows the tables the brief suggests, plus two with a reason:

| Table | Holds |
|---|---|
| `User` | Email, scrypt password hash, name |
| `Project` | Name, description, creation date, upload stats, `codeVersion` (+1 per upload) |
| `File` | Path, content and size of each uploaded file. Secret files are kept by path only |
| `Review` | Lens, scope, files read, summary, issues and recommendations (JSON checked with Zod), highest severity, model snapshot |
| `AiProvider` | Name, base URL, model, **encrypted** API key, main flag |
| `ChatSession` / `Message` | Conversations and their messages, with each answer's source files |
| `Insight` *(added)* | Generated architecture overview and docs: one per project and kind, so regenerating replaces it |
| `DemoUsage` *(added)* | Demo requests per user per day, so daily limits survive restarts and work with more than one server |

Reviews and chats reach their owner through the project, so there is no duplicated `userId`. Deleting a project deletes its files, reviews, chats and docs (`onDelete: Cascade`).

## Local models: LM Studio and Ollama

| Provider | Base URL | API key |
|---|---|---|
| LM Studio | `http://localhost:1234/v1` | leave empty |
| Ollama | `http://localhost:11434/v1` | leave empty |
| OpenAI | `https://api.openai.com/v1` | required |
| OpenRouter | `https://openrouter.ai/api/v1` | required |

Add one in **Settings → Add provider** (presets fill the URL), then use **Test connection** to list the models the server offers.

> [!NOTE]
> **Local models work when you run Redline yourself** (`ALLOW_LOCAL_PROVIDERS=true`). The hosted site can't reach your `localhost`. To use a local model there, give it a public https address with a secure tunnel (Cloudflare Tunnel, ngrok) and use that as the base URL.

> [!TIP]
> Local models start with a small context (Ollama: 4,096 tokens), and larger reviews get cut off without a warning. Raise it: `OLLAMA_CONTEXT_LENGTH=16384 ollama serve`, or raise the context length when you load a model in LM Studio.

## Scripts and tests

| Where | Command | What it does |
|---|---|---|
| root | `npm run dev` | Database + API + web app together |
| root | `npm run db` | Database only |
| `backend/` | `npm test` | Unit tests (prompt building, output parsing, unzip rules, retrieval, crypto…) |
| `backend/` | `npm run test:e2e` | End-to-end API tests against the local database, with a fake model server (no real AI calls) |
| `backend/` | `npm run lint` | oxlint (type-aware) |
| `frontend/` | `npm test` | Unit tests (URL state, upload slimming, severity, diff lines…) |
| `frontend/` | `npm run lint` | ESLint |

## Deployment

| Part | Host | Settings |
|---|---|---|
| Frontend | Vercel | Root `frontend`, env `BACKEND_URL` + `BFF_SECRET`. Function max duration ≥ 280 s (long reviews) |
| Backend | Render | Root `backend`, build `npx -y npm@11 ci --include=dev && npx prisma migrate deploy && npm run build`, start `node dist/main`, health check `/api/health` |
| Database | Neon | Direct connection URL as `DATABASE_URL` |

On the backend, set `NODE_ENV=production` and fresh values for `JWT_SECRET`, `ENCRYPTION_KEY` and `BFF_SECRET`. **Don't** set `ALLOW_LOCAL_PROVIDERS`.

## Security and privacy

- **Passwords:** scrypt with a random salt, compared in constant time. Login is rate-limited, and an account locks for a while after repeated failures (without revealing which emails exist).
- **Sessions:** a JWT in an `httpOnly`, `SameSite=Lax` cookie (Secure in production). Every API route needs a login unless it is marked public.
- **Ownership:** every project route checks the owner first. Another user's project answers "not found".
- **API keys:** encrypted with AES-256-GCM, never sent back to the browser, and only ever sent to the URL they were saved with.
- **SSRF guard:** on a hosted server, model URLs that point at private networks or cloud metadata are blocked, and redirects are refused.
- **Private files:** `.env`, private keys and credential files are uploaded **empty**. Only their names are stored, and they are never opened or sent to a model.
- **Secrets in code:** API keys, tokens and passwords written inside files are replaced with `‹redacted›` before saving.
- **Model output is untrusted:** reviews are validated with Zod, and chat answers and docs render as Markdown without raw HTML.
- **Security headers:** a Content-Security-Policy that only allows Redline's own origin and forbids framing, `nosniff`, and no `X-Powered-By`.
- **No secrets in git:** only `.env.example` files are tracked.

## Limits

| What | Limit |
|---|---|
| Picked ZIP (slimmed in the browser) | 200 MB |
| Upload after slimming | 10 MB |
| One file | 512 KB (larger files are skipped as data) |
| Files per project | 2,000 (checked before unpacking) |
| Uploads | 10 per minute per user |
| One review | 48,000 characters of code with your own model, 160,000 with the demo. Whole files, source first; the report says how many were left out |
| Model time | 270 s per request |
| Demo model | 10 requests per account per day, 200 per day for the whole site |

## Notes

- **Tested models:** Gemini 3.5 Flash-Lite (the demo), Ollama with `qwen2.5-coder` (3B and 7B), and free OpenRouter models. **LM Studio was tested through Ollama**: both use the same OpenAI-compatible API, and LM Studio doesn't run on the Intel Mac used to build this project.
- **Chat retrieval is keyword-based** (the brief allows simple retrieval). It works best in English, because code names are English. An Arabic question can still match Arabic text in the code, like UI strings or comments. Embeddings would be the next step.
- **Reviews wait for the model.** Requests are synchronous with a 270-second budget. A job queue with progress would be the next step for very slow local models.
- **Big projects are sampled, not chunked.** A whole-project review sends as many whole files as fit (source code first). Before you run it, the form shows "N of M files fit".
- **Logout** removes the cookie. Tokens are stateless, so a stolen token stays valid until it expires (7 days). A token denylist would fix that.
- **After a new upload,** old reviews and docs are labelled "code changed" instead of pointing at lines that may have moved.

## Project docs

| Document | What's inside |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Frontend and backend architecture, database design, AI integration flow, trade-offs |
| [AUDIT.md](AUDIT.md) | Security and performance checks: what was tested and the results |
| [AI_USAGE.md](AI_USAGE.md) | AI tools, prompts, generated vs. hand-written code, engineering decisions |
| [nextjs-principles.md](nextjs-principles.md), [nest-principles.md](nest-principles.md) | The engineering rules I gave the AI for the frontend and the backend |
| [backend/README.md](backend/README.md) | API modules, routes, scripts, Render setup |
| [frontend/README.md](frontend/README.md) | App structure, data flow, scripts, Vercel setup |

<br>

<div align="center">
  <a href="https://redline-tau-eight.vercel.app">
    <img src="docs/readme/banner.png" alt="Redline: code review, on your terms" width="100%">
  </a>
  <br><br>
  <sub>Built by Ashraf · © 2026 All rights reserved.</sub>
  <br>
  <sub>(Redline is under active development and keeps improving.)</sub>
</div>
