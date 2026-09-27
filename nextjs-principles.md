# Next.js principles

I wrote these rules for the AI that helped me build the Redline frontend (`frontend/`). The AI had to read them before any frontend work, and I used them to review what it wrote. Part 13 is about how I wanted the AI to work, not only what the code should look like.

## 1. Architecture

- **The UI never knows where data comes from.** Text lives in `src/content/` and data comes from `src/lib/api/`. Components get everything as props. A component should not own hard-coded text and render it at the same time.
- **No business logic inside JSX.** Filtering, sorting and formatting happen above the `return` (in a helper or a variable), never inside the markup.
- **Server Components by default.** Add `"use client"` only when a component really needs state, effects or event handlers.
- **One job per file.** If a file fetches, decides and renders all at once, split it.
- **Reuse the primitives.** Before you write a button, card or heading, look in `components/ui/`. If something appears on two pages, it becomes a shared component. Don't style the same element again on every page.
- **Strong types, never `any`.** Every data shape has a type. Use string unions (`"LOW" | "HIGH"`) instead of a plain `string` for fixed values.

## 2. Data fetching

- Fetch data in Server Components, as close as possible to where it's used. Don't pass data down many levels if a lower Server Component can fetch it itself.
- **Decide about caching on purpose.** For every server fetch, think: can it be cached, or must it be fresh? Follow the project's Next.js version and what the code already does.
- Use Server Actions for changes (create, delete, run). Use an API route only when you really need an HTTP endpoint (a webhook, an outside caller, or a body bigger than a Server Action allows).

## 3. Props and components

- Props always have a type.
- Keep props few and clear. More than 5 or 6 means the component should be split, or the props grouped into one object that makes sense.
- Don't pass a whole object when the component reads only one field.
- Prefer `children` (composition) over a long list of options.

## 4. State

- Keep state where it is used. Lift it up only when it is really shared.
- Never store a value you can compute. Compute it during render instead, so two copies can't get out of sync.
- Use the URL for state people may want to share or go back to (filters, pages, the open file, the open tab).
- Global state (Context, Zustand) only when several pages truly need it. Never as the default.

## 5. Rules of hooks

- Call hooks only at the top of a Client Component or a custom hook. Never inside conditions, loops or nested functions. If something should run only sometimes, put the condition inside the hook.
- Call hooks in the same order on every render.
- Never call hooks from a Server Component or a normal function.

## 6. `useEffect` is the last tool, not the first

Use `useEffect` only to sync with something outside React: a DOM API, a subscription, a timer. In Next.js most data belongs in a Server Component fetch, not in an effect.

- Don't use an effect to compute data from props or state. Compute it during render.
- Don't use an effect to react to a click. Put that code in the event handler.
- Every effect that starts something must clean it up (remove the listener, clear the timer, abort the request).
- Fill the dependency array honestly. Don't turn off the lint rule to hide a warning: a missing dependency is a real bug.

## 7. TypeScript

- Never use `any`. If you really don't know a type, use `unknown` and check it.
- Validate data from outside (forms, APIs) at runtime, and get the type from the same schema, so the check and the type can't drift apart.
- Define each shape once (`src/lib/types.ts`) and import it. Don't write the same type twice.

## 8. Performance

- Images go through `next/image`. A `fill` image always gets `sizes`.
- Load heavy parts later (`next/dynamic`) when the first screen doesn't need them.
- Use `memo`, `useMemo` and `useCallback` only after you have measured a real problem. Using them everywhere just adds noise.
- Keep big files out of the first page load.
- Every list item gets a stable, unique `key`. Use the index only when the list never changes order.

## 9. Errors and edge cases

- Use `loading.tsx`, `error.tsx` and `not-found.tsx` instead of building the same loading and error screens by hand on every page.
- Always validate on the server, even when the form validates too. Client checks are for comfort, server checks are for security.
- Never assume data exists. Handle `null` and `undefined`, especially after a fetch.
- Every async or filterable view needs a loading state, an error state and an empty state. The user should never see a blank or frozen screen.

## 10. Naming and consistency

- Files are kebab-case, components are PascalCase, everywhere.
- Pick one way for one thing. Named exports for components; don't mix default and named exports without a reason.
- Custom hooks start with `use` and contain hook logic only. A plain helper is not a hook.

## 11. Security

- A secret never gets the `NEXT_PUBLIC_` prefix. Anything with that prefix is sent to the browser.
- No secrets and no sensitive logic in Client Components. Calls to the backend go through server-only code (`lib/api/`).
- Treat user content and model output as unsafe. Avoid `dangerouslySetInnerHTML`; when you must use it, the HTML must come from a tool that escapes it (like Shiki).
- Data from the URL, `localStorage` or cookies is user input. Check it before you use it.

## 12. Accessibility

- Use the right HTML elements (`button`, `nav`, `label`, `header`), not a `div` with a click handler.
- Everything must work with the keyboard alone: a clear tab order, Enter and Space, a visible focus ring. Nothing important may depend on hover.
- Every input has a `label` (or an `aria-label`). A placeholder is not a label.
- Take care of focus when a view changes or a dialog closes. Focus must never stay on something that is gone.

## 13. How I want you to work

These rules are about your behavior while you write code. A change can follow all the rules above and still be a bad change if it ignores these.

- **Look before you decide.** Read the existing folders, components, helpers and names before you create anything. Never guess whether a file, API or package exists. Check.
- **Reuse before you create.** If something similar already exists, extend it. Don't build a second version next to it.
- **Make the smallest change that does the job.** A small feature must not turn into a rewrite of other files. Clean-ups happen only when I ask for them.
- **Don't over-engineer.** No new abstraction, context, service or package without a real reason today. Build what I asked for, not what might be needed one day.
- **Don't break other things.** Before you change or delete shared code, find everything that uses it.
- **No fake "done".** No TODOs, mock data, placeholders or empty functions left behind, unless I asked for a placeholder.
- **Don't hide problems.** No `any`, empty `catch`, `@ts-ignore` or disabled lint rule just to make a warning go away. Fix the cause, or tell me about it.
- **Check before you say it works.** Run the type check, lint and tests. "It looks right" is not the same as "it passes".
- **Leave config files alone** (`package.json`, `tsconfig`, ESLint, `next.config`) unless the task needs it, and tell me when you change one.
- **When something is unclear, follow the existing pattern.** Don't invent a new style if the code already does the same kind of thing somewhere else.
