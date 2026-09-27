# AI usage

This document explains how I used AI to build Redline, and what my own job was.

## Summary

**The AI wrote almost all of the code. I led the work.** I planned the project, set the rules and made the decisions. I reviewed the changes, tested them, and corrected the direction when the AI was wrong. I treated the AI like a fast developer on my team: it types the code, but I decide what gets built, how, and when it is good enough.

I made sure I could explain the important parts of the code and the reasoning behind the main technical decisions.

## AI tools used

| Tool | What I used it for |
|---|---|
| **Claude Code with Claude Opus** (Anthropic) | The builder: planning, writing code, tests and docs, running commands, audits |
| **Claude Sonnet** (Anthropic) | The second reviewer: checked finished files and parts against my principles files and criticized them |
| **ChatGPT** (OpenAI) | Web research to compare options before a decision |
| **Google Gemini 3.5 Flash-Lite** | Not a coding tool: the free demo model *inside* Redline, also used for real review tests |
| **Ollama** (`qwen2.5-coder` 3B and 7B) and **OpenRouter** free models | Testing Redline with local and cloud providers |

Commits are made under my name. I chose to disclose the AI help here, in one clear place, instead of in commit trailers.

## How I worked

I did not ask the AI to "build the app". I built a process around it:

1. **Read the brief first.** I turned it into a step-by-step plan (a checklist file). Every session started from the first unchecked step.
2. **Rules before code.** I wrote working rules for the AI and kept them in local files it had to read at the start of every session:
   - **How we work:** short reports after each task, many small commits, never push, ask when a request is unclear, and tell me when I am about to do something wrong.
   - **Engineering principles:** Server Components by default, no logic inside JSX, strong types (never `any`), shared primitives instead of copy-paste.
   - **Design rules:** I chose the direction (black, white and silver, with red used only where a human must look; Sourcegraph as a reference for principles, not looks). The AI turned it into a design checklist that every page had to pass.
3. **Small parts, checked one by one.** The frontend was built page by page, and each page part by part. After each part the AI stopped, and I checked it in the browser before we continued.
4. **A second AI as a reviewer.** When Opus finished a file or a part, I gave it to **Claude Sonnet** for review and criticism. Sonnet had principles files: Next.js principles for the frontend, NestJS principles for the backend, and so on. When Sonnet found a problem, I passed it back to Opus, and Opus fixed what needed fixing. One model builds, another one checks.
5. **Research, discuss, then decide.** For important choices I asked for the options and the trade-offs, and I used **ChatGPT** to research on the web before deciding. Two examples:
   - **Prisma 7.10 (stable), not Prisma 8:** version 8 was only a release candidate, so we chose the stable version.
   - **Hosting on Vercel + Render + Neon:** NestJS needs a long-running Node server, so the backend went to Render, the Next.js app to Vercel, and PostgreSQL to Neon.

   We kept a decisions log with the reason for each decision and the options we rejected. The main ones are listed [below](#engineering-decisions) and in the trade-offs section of [ARCHITECTURE.md](ARCHITECTURE.md).
6. **Understand each step.** After each step the AI wrote a simple explanation of what was built, how, and why. I used these notes to understand the code, not only to accept it.
7. **Audit at the end.** I asked for full reviews against the brief, a logic-bug hunt, and a security and performance audit. Fixes went in small commits, one problem at a time, sometimes on a separate branch that I reviewed and merged myself.

## Prompts used

Real prompts from the project. Many were written in Arabic; these are English translations.

**Starting and continuing**
> Read CLAUDE.md, vibe.md and the assessment brief before we start.

> Continue. *(Open the plan and do the next unchecked step.)*

**Asking for a review, not code**
> Check the whole system, but don't change anything. Just inspect it, take notes and make a plan. Hunt for any logic mistakes in the project. Your main reference is the assessment brief. Be ready to discuss with me and justify every decision you make.

**Fixing with care**
> Fix all the problems in order, slowly, don't rush. Test after you finish and make sure everything works. Do all the fixes on a new branch with a short, professional name. When you finish, I will merge it manually. Just tell me how.

**Thinking together about a design idea**
> Would you advise me to remove the code card in the middle of the workspace, and open the code in a bigger popup when you hover a file? Don't change anything, just think with me.

*(The answer was no: the code preview is a required feature, and issue markers, line links and chat sources all need the code next to the panel. I kept the layout.)*

**Security and performance audit**
> I will give you two kinds of checks, a quick check and a deep audit. Check what needs checking and reply briefly with the result. Don't change anything now, only inspect. Some points may be too much for this project; just tell me.

**Documentation**
> Search the web and GitHub for the best ways to write a professional README. Put a screenshot of the hero at the top and the logo at the bottom, and add animated demos.

**Cleaning up**
> Code hygiene. *(A fixed command: tidy the code and delete dead code, with zero change to the UI and no performance cost.)*

## Generated code vs. my own work

| Area | Written by | My part |
|---|---|---|
| Backend (NestJS modules, Prisma schema, migrations) | AI | Chose the stack and the module plan, reviewed the schema and the migrations |
| Frontend (pages, components, styles) | AI | Set the design direction and the rules, checked each part in the browser, asked for changes |
| AI integration (prompts, output parsing, retrieval) | AI | Decided how model output is trusted (it isn't: validate it first), the review budget, and the retrieval approach |
| Tests (unit, e2e, browser scripts) | AI | Asked for tests with every feature and fix, ran them, read the failures |
| Docs (README, ARCHITECTURE, AUDIT, this file) | AI, from my notes and decisions | Decided the content and structure, edited the text |
| Working rules, plan, decisions log | Together | The rules and every final decision are mine |
| Setup and deployment | Me | GitHub repo, Vercel, Render and Neon setup, environment variables and secrets, merges and pushes |
| Hand-written application code | Very little | Small manual edits only |

## How I checked the AI's work

- **Automated tests:** 69 backend unit tests, 25 end-to-end API tests (with a fake model server, so no real AI calls), and 20 frontend unit tests. Strict TypeScript and lint are clean in both apps.
- **Browser checks:** interactive flows were tested with headless browser scripts, plus my own manual checks.
- **Live tests:** on the deployed site we tested sign-up, upload, a real review, chat, and access to another user's data (every endpoint answered 404).
- **Audits:** a check against the brief, a logic-bug hunt, and a security and performance audit. The results are in [AUDIT.md](AUDIT.md).
- **Measuring instead of guessing:** for example, the largest allowed upload was measured at 0.7 s and +88 MB of memory.

## Where the AI was wrong, and how I caught it

The AI writes code fast, but it makes mistakes like any developer. These were found by my reviews and audits, and then fixed:

| Problem | How it was found | Fix |
|---|---|---|
| A ZIP with two entries that clean to the same path (`a/b.ts` and `a//b.ts`) crashed the upload with a 500 | Logic-bug audit, confirmed with a test | Keep the first copy, skip the second |
| ZIP entries starting with `./` were dropped, so some projects had "no readable files" | Logic-bug audit | Clean `./` instead of rejecting |
| A saved API key could never be removed (a card could not move to a keyless local server) | Logic-bug audit | "Remove the stored key" option |
| The severity filter matched only the worst severity, but the label did not say so | Logic-bug audit | Clear labels ("Worst: High") |
| The review budget counted plain text, but the prompt adds a line number to every line (about 6 more characters per line) | Logic-bug audit | Measure the real text that is sent |
| Project cards counted issues from diff reviews and from old code | Logic-bug audit | Skip diff reviews, mark old reviews as outdated |
| No security headers, no upload rate limit, history loaded every review at once | Security and performance audit | CSP and headers, 10 uploads a minute, paged history |
| Some browser test scripts failed for the wrong reason (bad selectors) | Rule: look at the real page before trusting a failed test | The page was checked directly; the app was right, the test was wrong |

## Engineering decisions

The most important decisions, and what we did not choose:

| Decision | Why | Not chosen |
|---|---|---|
| NestJS + PostgreSQL (the brief's preferred stack), Prisma 7 stable | Clear modules and guards, relational data, stable versions | FastAPI, MongoDB, Prisma 8 RC |
| Backend-for-frontend: the browser only talks to Next.js | No CORS, the token and backend URL never reach the browser | The browser calling the API directly |
| JWT in an `httpOnly` cookie, passwords with Node's `scrypt` | JavaScript can't read the token; `scrypt` is built in and memory-hard | Token in localStorage, bcrypt/argon2 (native packages) |
| Every route protected by default (`@Public()` to open one) | A forgotten route stays safe | A guard on each route |
| Model output is untrusted: Zod validation, one retry, paths and lines checked against real files | Models return broken or invented data | Trusting the JSON as it comes |
| One gate for every AI call (`useProvider()`), an SSRF guard, encrypted API keys | Security rules live in one place | Checks spread over each feature |
| Secret files uploaded empty, secrets in code redacted | Private data never reaches a model | Uploading everything |
| Keyword retrieval for chat | The brief allows simple retrieval; no extra service | Embeddings and a vector database |
| A built-in demo model with daily limits | Reviewers can try Redline without a key | Bring your own key only |
| Stop at three bonus features | The brief prefers a smaller, well-built app | GitHub import, test generator, tech-debt scanner |

## Known limits

- **Logout** deletes the cookie, but the token stays valid until it expires (7 days).
- **No job queue:** reviews run inside the request (up to 270 seconds).
- **No monitoring** beyond the hosting platforms' logs.
- **No load test:** only the worst-case upload was measured.
- **Chat search is keyword-based,** so it works best in English.
- **One small open bug:** after the first question in a new chat, the open file switches back to README.

## What I learned

AI makes writing code much faster, so the real work moves to **deciding, reviewing and testing**. The best results came from clear rules, small steps, asking for options before code, and checking changes before accepting them.
