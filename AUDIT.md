# Security and performance checks

What was checked, how, and the result. ✅ passed · 🟡 passed with a known limit.
Last run: 2026-09-27.

**How:** a code review of both apps, the automated tests (backend unit + end-to-end, frontend unit), live requests against the deployed site, and one measurement.

## Security

| Check | Result | How it was checked |
|---|---|---|
| Passwords stored hashed | ✅ scrypt with a random salt, compared in constant time | Code, unit tests |
| Login cookie | ✅ `HttpOnly`, `Secure`, `SameSite=Lax`, expires after 7 days | Live site |
| Pages and API need a login | ✅ Pages redirect to `/login`, the API answers 401 | Live site, e2e |
| No access to other users' data (IDOR) | ✅ 9 of 9 endpoints answer 404 to another user (project, files, file content, review, review list, chats, docs, run review, delete). Ownership is checked on the server | Live site with a second account, e2e |
| Input validation | ✅ Zod schemas on every body and query, UUID checks on ids; bad input → 400 | Code, live site, e2e |
| Rate limits | ✅ Per user (per IP when signed out): 100/min in general, 10/min login, **10/min uploads**, 10/min reviews and docs, 20/min chat | e2e |
| Brute-force protection | ✅ 5 failed logins for one account from one IP → 15 min wait; 20 per hour from all IPs; unknown emails take the same time | e2e |
| ZIP size and type | ✅ 10 MB on the server; the archive is parsed, not trusted by name or MIME type | Code, unit tests |
| ZIP bomb | ✅ 512 KB per file and 50 MB unpacked in total; sizes are checked before inflating | Code, unit tests |
| Number of files in a ZIP | ✅ Max 2,000, counted **before** inflating | Unit test |
| Path traversal (`../`) and odd names | ✅ `..` and absolute paths rejected, `./` cleaned, duplicate paths skipped | Unit tests |
| Nested ZIPs, symlinks, dangerous files | ✅ Only UTF-8 text is kept; nothing is unpacked to disk or executed | Code |
| Storage of uploaded files | ✅ In the database, behind the ownership check; no public URLs, no temp files | Code |
| Secret files and secrets in code | ✅ `.env`, keys and credentials are uploaded empty and never sent to a model; inline keys are replaced with `‹redacted›` | Code, unit + e2e tests |
| CORS | ✅ Not enabled: a foreign site gets no CORS headers | Live site |
| CSRF | ✅ `SameSite=Lax` cookie, Server Actions check the origin, no GET request changes data | Code |
| SQL injection | ✅ Prisma parameters everywhere; the one raw query is a parameterized tagged template | Code |
| XSS | ✅ React escapes text, code highlighting escapes code, Markdown renders without raw HTML | Code |
| SSRF (user-typed model URLs) | 🟡 Private, loopback and cloud-metadata addresses are blocked and redirects refused. Limit: a DNS change between the check and the request isn't pinned | Code, unit + e2e tests |
| Security headers | 🟡 CSP (own origin only, `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`; HSTS from Vercel; no `X-Powered-By`. Limit: the CSP allows inline scripts (Next.js inlines page data) | Local server with a browser (no CSP errors), e2e |
| API keys | ✅ AES-256-GCM, never returned to the browser, only sent to the URL they were saved with | Code, e2e |
| Secrets in git, frontend or logs | ✅ Only `.env.example` files tracked; no `NEXT_PUBLIC_` values; no request bodies or keys logged | Code, git |
| Error messages | ✅ Server errors return a generic message; no stack traces or internals | Code |
| Dependencies | ✅ `npm audit`: 0 known vulnerabilities (backend, frontend, root) | `npm audit --omit=dev` |

## Performance

| Check | Result | How it was checked |
|---|---|---|
| Unzipping the largest allowed upload | 🟡 10 MB ZIP, about 48 MB of text in 1,990 files: **0.7 s**, **+88 MB** RAM. Runs in memory with hard caps | Measured |
| Upload size reaching the server | ✅ The browser drops `node_modules`, build output and binaries first; the server accepts at most 10 MB | Code |
| Review history | ✅ 20 reviews per page, search and filters run in the database, stable order across pages | e2e, browser |
| Workspace data | ✅ Loads only the open tab (chat titles only, one conversation's messages, 5 recent reviews, one review for the issue dots) | Code, browser |
| Database indexes | ✅ On every main lookup (projects, reviews, chats, messages, providers, demo usage, file paths) | Schema |
| Static assets | ✅ Brotli compression, `immutable` caching for one year | Live site |
| Loading and error states | ✅ Loading pages, an error page and "not found" pages | Code |
| Timeouts for AI calls | ✅ 270 s per model request, 10 s for connection tests | Code |
| Retries | ✅ No retry loops: one retry only when the model's JSON is invalid | Code, e2e |
| Limits per review | ✅ Character budget (48k own model, 160k demo), whole files first, time budget | Code, unit tests |
| Server stops mid-review | ✅ Nothing is saved half-way: results are saved only after the model answers | Code, e2e |
