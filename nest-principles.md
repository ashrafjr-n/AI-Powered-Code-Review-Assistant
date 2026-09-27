# NestJS principles

I wrote these rules for the AI that helped me build the Redline backend (`backend/`). The AI had to read them before every backend task, and I used them to review its work. Every rule here is used in the code today. If you want to change a rule, change the code and this file together.

## 1. Structure

- **One module per feature:** `auth`, `projects`, `files`, `providers`, `reviews`, `chat`, `insights`. A module owns its controller, service, Zod schemas and tests.
- **Controllers are thin.** A controller reads the input, calls one service method and returns the result. No database calls and no business logic in controllers.
- **Services hold the logic.** They talk to the database and other services.
- **Put pure logic in plain functions,** in their own files (`unzip.ts`, `review-prompt.ts`, `retrieval.ts`). No Nest, no database. They are easy to read and easy to unit test.
- **Share with exports, not copies.** If a feature needs another feature's service, import its module (for example `ProjectsModule` exports `ProjectsService`). Never copy the code.
- `PrismaModule` is the only `@Global()` module, because almost everything needs the database.
- The backend is ESM: local imports end with `.js`.

## 2. Security by default

- **Every route needs a login.** `AuthGuard` is a global guard. A route is open only if it has `@Public()`. A forgotten route stays safe.
- Get the user with `@CurrentUserId()`. Never take a user id from the body or the URL.
- **One ownership check:** every `/projects/:id/...` service calls `ProjectsService.findOwned(userId, id)` first. Don't write your own check.
- **Another user's data answers 404, not 403.** We don't even confirm that it exists.
- **Never return secrets.** Pick the columns with `select` (never `passwordHash`). API keys are stored encrypted and the API only returns `hasApiKey`.
- **Rate limits:** a global limit per user, and stricter `@Throttle` limits on expensive or sensitive routes (login, upload, reviews, chat, docs).
- Guard order matters: `AuthGuard` first, then `UserThrottlerGuard` (it needs the user id).

## 3. Validation

- **Validate every input with Zod.** Use `@Body({ schema })` or `@Query({ schema })`. The global `StandardSchemaValidationPipe` checks it and answers 400.
- **Get the TypeScript type from the schema** (`z.infer`), so the type and the rule can never be different.
- Check ids with `ParseUUIDPipe({ version: '7' })`, so a bad id fails before any database call.
- **Never trust paths or ids from the browser.** Read files from the database, filtered by the project, and use only what really exists.
- Add a `.max()` to strings and arrays. Very long input can slow the server down.

## 4. Errors

- Throw Nest exceptions (`BadRequestException`, `NotFoundException`…) with a short message a user can read.
- When the frontend needs to react to an error, add a `code` (for example `DEMO_LIMIT`, `SENSITIVE_FILE`, `LOGIN_LOCKED`).
- Turn errors from other services into our own errors in **one** place (`describeProviderError()`). Never send stack traces or internal details to the client.
- Don't catch an error just to hide it. Catch it only to turn it into a clear answer.

## 5. Database (Prisma)

- The schema is the source of truth. Every change is a **migration** that goes into git. Production only runs `prisma migrate deploy`.
- **Let the database protect the data:** unique constraints instead of "check first, then insert" (race conditions), `onDelete: Cascade` for children, and indexes that match the real queries.
- **Use a transaction when several writes belong together** (replace all files, save a chat question with its answer). Either everything is saved or nothing is.
- **Save only after the slow work succeeds.** Call the AI model first, then write to the database.
- Load only what the screen needs: file lists without content, list pages with `skip`/`take`, and `_count` instead of loading rows just to count them.
- Ids are UUID v7.

## 6. Calling outside services (AI models)

- **One gate for all AI calls:** `ProvidersService.useProvider()`. It picks the model, checks the URL, counts demo usage and turns errors into clear answers. New AI features must use it.
- **Always set a timeout.** Retry only when retrying helps (once, when the model's JSON is invalid).
- **The model's answer is untrusted input.** Parse it, validate it with Zod, and keep only file paths and lines that really exist.
- **User-typed URLs can attack the server (SSRF).** Check them with `assertSafeBaseUrl()`, refuse redirects, and never send a stored key to a new URL.
- Files that usually hold secrets (`.env`, keys) are never sent to a model.

## 7. Configuration

- Read required env values with `requireEnv()`. The app stops at startup with a clear message if one is missing.
- No secrets in code. Every variable is listed with a comment in `.env.example`.
- Local-only options (like `ALLOW_LOCAL_PROVIDERS`) must be safe when they are not set.

## 8. Tests

- Unit tests for the pure functions (`*.spec.ts`, Vitest).
- E2E tests (`test/*.e2e-spec.ts`) run the real app with `configureApp()` (the same setup as `main.ts`), the local database, and a fake model server. No real AI calls.
- For every new route, test at least: no login → 401, bad input → 400, another user → 404.
- Tests create their own users and delete them at the end.

## 9. Keep it simple

- Use what Node and Nest already have before adding a package (`node:crypto` for scrypt and AES-GCM, `net.BlockList` for the SSRF guard, Nest's built-in Zod support instead of class-validator).
- Don't build for a future that may never come. When you take a shortcut on purpose, write a `ponytail:` comment that says the limit and how to upgrade it.
- Comments explain **why**, not what the code does.
- Before you finish: `npx tsc --noEmit`, `npm run lint`, `npm test` and `npm run test:e2e` must all pass.
