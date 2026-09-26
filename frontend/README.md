# Redline — frontend

Next.js app for Redline: landing page, auth pages and the app (projects, workspace with code viewer, review / chat / insights, review history, model settings).

It is also the **backend-for-frontend**: pages and Server Actions call the NestJS API from the Next.js server with `apiFetch()`, forwarding the login cookie. The browser talks to this app only (see [../ARCHITECTURE.md](../ARCHITECTURE.md)).

## Stack
- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS 4 (design tokens in `src/app/globals.css`)
- Shiki (code highlighting on the server), react-markdown + remark-gfm (generated docs), fflate (slims ZIPs in the browser), lucide-react (icons)

## Run locally
The backend must run on port 4000 (see [../backend/README.md](../backend/README.md)).

```bash
cd frontend
cp .env.example .env.local   # BACKEND_URL=http://localhost:4000
npm install
npm run dev                  # http://localhost:3000
```

## Environment
| Variable | Notes |
|---|---|
| `BACKEND_URL` | NestJS base URL without `/api`, e.g. `http://localhost:4000` or `https://<app>.onrender.com`. Server-side only |
| `BFF_SECRET` | Same value as the backend's. Signs the user's IP so rate limits count real users. Server-side only |

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / run it |
| `npm test` | Unit tests (Node's built-in test runner, `src/**/*.test.ts`) |
| `npm run lint` | ESLint |

## Structure (`src/`)
| Folder | What's inside |
|---|---|
| `app/` | Routes. `(auth)` login/register, `(app)` the signed-in app with its top bar and rail, `@context` = page info in the top bar |
| `components/ui/` | Primitives: button, dialog (native `<dialog>`), field, badges, usage bar… |
| `components/<area>/` | Parts of one area: `landing`, `app` (shell), `projects`, `workspace`, `review`, `reviews`, `settings` |
| `content/` | Page text. Components get it as props |
| `lib/api/` | Server-only data access: one module per backend area. Pages and actions import only these |
| `lib/` | Small helpers: URL state (`workspace-url.ts`), severity, grouping, formatting, ZIP slimming (`upload.ts`), sensitive file names |
| `proxy.ts` | Optimistic cookie check that redirects to `/login` (the backend does the real auth check) |

## How it works
- **Data:** pages are async Server Components that read through `lib/api/`. Changes are Server Actions that check input, call the backend and `revalidatePath`.
- **URL is state:** the selected file, line, tab, chat and open document live in the query string, so links, reload and back/forward work.
- **Uploads:** a ZIP, loose files or a whole folder (drag and drop or "Choose a folder"; dropped folders are walked with `webkitGetAsEntry()` in `lib/dropped-files.ts`, and `node_modules`-like folders are never opened). The same rules (`lib/upload.ts`) slim everything in the browser (drops `node_modules`, builds, binaries; empties secret files) and sent to `/api/...`, which `next.config.ts` rewrites to the backend. Server Actions are limited to 1 MB bodies. The same drop zone opens from **Replace** in the workspace to upload a newer version (all files are replaced; past reviews keep their file list).

## Deploy (Vercel)
Root directory `frontend`, env `BACKEND_URL` and `BFF_SECRET`. For long reviews the function max duration must be at least 280 s.
