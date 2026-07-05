# 🎨 Homework 1 — Master Prompt for the Frontend (Angular 20+)

> **Author:** Elena Chiperi · **AI tool:** Claude Code · **Target stack:** Angular 20+ · **Design:** Microsoft Fluent 2
>
> This prompt generates a polished Angular frontend whose sole purpose is to **visually
> verify** the Banking Transactions API built by `PROMPT.md` (Java + Spring Boot, port 3000).
> It is engineered from Anthropic's official *Prompting best practices* and from current
> Angular 20 and Microsoft Fluent guidance (see the appendix). Run `PROMPT.md` first.

---

## ▶️ How to use this prompt

1. Build the backend with `PROMPT.md` first; make sure it runs on `http://localhost:3000`.
2. Open Claude Code in the `homework-1/` directory.
3. Copy everything between `<!-- BEGIN PROMPT -->` and `<!-- END PROMPT -->` and paste it.
4. Let Claude plan, approve, then run the app and capture screenshots for `docs/screenshots/`.

---

<!-- BEGIN PROMPT -->

<role>
You are a senior Angular frontend engineer and UI designer who builds clean, accessible
single-page applications and follows Microsoft's Fluent 2 design language. You write
idiomatic, modern Angular (v20+): standalone components, signals, the new control flow,
and dependency injection via `inject()`. You care about visual polish, responsive layout,
and accessibility.
</role>

<context>
This frontend is a companion to an existing Banking Transactions REST API (Java + Spring
Boot, running at http://localhost:3000). Its single purpose is to let a reviewer visually
exercise and verify every API endpoint without curl or Postman. This is part of an
academic Homework 1 submission graded on functionality, code quality, documentation, and
demo/screenshots, so the UI must look genuinely professional and every backend feature
must be reachable from the screen. Keep the app self-contained in a subfolder so it does
not interfere with the backend.
</context>

<objective>
Build an Angular 20+ single-page application styled with Microsoft Fluent 2 design that
provides a UI for every endpoint of the banking API, with clear feedback for success,
validation errors, not-found, and rate-limit responses. Produce a project that starts
with a single command and proxies API calls to the backend.
</objective>

<tech_stack>
- Angular 20+ generated with the Angular CLI, located in `homework-1/frontend/`
- TypeScript (strict mode on)
- Standalone components only (no NgModules)
- Signals for component state (`signal`, `computed`, `input`, `output`, `model`); use
  RxJS only at the HttpClient boundary and convert to signals for the template
- New control flow in templates (`@if`, `@for` with `track`, `@switch`, `@defer`)
- `inject()` for dependency injection; `provideHttpClient()` in app config
- Change detection: `OnPush` everywhere; prefer a zoneless setup if straightforward
- Design system: Microsoft Fluent 2. Prefer the official `@fluentui/web-components`
  (Fluent 2) integrated per Microsoft's Angular guide — register the components you use and
  add `CUSTOM_ELEMENTS_SCHEMA` to the standalone components that use them. If the web
  components version is unstable, fall back to a hand-built Fluent 2 look using Fluent
  design tokens in CSS (see <design>). Either way the result must clearly read as Microsoft
  Fluent.
- Routing: Angular Router with lazy-loaded routes
- Do not add state libraries (NgRx, etc.), UI kits other than Fluent, or a backend mock —
  the real API is the source of truth.
</tech_stack>

<api_contract>
Base URL (via dev proxy): /api → http://localhost:3000

Endpoints to cover in the UI:
- POST   /transactions                        create a transaction
- GET    /transactions                        list, with filters: accountId, type, from, to
- GET    /transactions/{id}                    fetch one
- GET    /accounts/{accountId}/balance         account balance
- GET    /accounts/{accountId}/summary         totals + count + most recent date
- GET    /accounts/{accountId}/interest?rate=&days=   simple interest
- GET    /transactions/export?format=csv       CSV download
- Rate limiting: any endpoint may return 429 when >100 requests/min per IP

Transaction shape:
  { id, fromAccount, toAccount, amount, currency, type, timestamp, status }
  type ∈ {deposit, withdrawal, transfer}; status ∈ {pending, completed, failed}

Define a typed `Transaction` interface and a single `TransactionApiService` that wraps
HttpClient and exposes typed methods for every endpoint above.
</api_contract>

<features>
Build these views/screens, reachable from a Fluent navigation (left nav or top bar):

1. Transactions list
   - A Fluent data grid/table of all transactions with columns id (shortened), from, to,
     amount + currency, type, status (as a colored Fluent badge), timestamp.
   - Filter controls: account id, type (dropdown), date range (from/to). Filters combine
     and call GET /transactions with the matching query params.
   - A "Export CSV" button that downloads the file from /transactions/export?format=csv.

2. Create transaction
   - A Fluent form with fields fromAccount, toAccount, amount, currency (dropdown:
     USD/EUR/GBP/JPY), type (dropdown). Use Angular reactive forms with client-side
     validation mirroring the backend (ACC-XXXXX format, positive amount ≤ 2 decimals).
   - On submit, POST /transactions. On 201 show a success toast and refresh the list. On
     400 map the backend `details[]` array to per-field error messages.

3. Transaction details
   - Look up by id; render the full object in a Fluent card. Show a friendly empty/404
     state when not found.

4. Account tools
   - Balance: input an accountId → show the balance.
   - Summary: show totalDeposits, totalWithdrawals, transactionCount, mostRecent
     transactionDate in Fluent cards/stat tiles.
   - Interest calculator: inputs accountId, rate, days → call the interest endpoint and
     display inputs + computed interest.

5. Global UX
   - A reusable toast/notification for success and errors.
   - Explicit handling of HTTP 429: show a clear "Rate limit reached, try again in a
     moment" message rather than a generic error.
   - Loading and empty states for every data view.
   - Light/dark theme toggle using Fluent design tokens.
</features>

<design>
Match Microsoft Fluent 2 closely so the app looks like a modern Microsoft product:
- Typography: Segoe UI Variable / Segoe UI as the primary font, with the Fluent type ramp
  (clear sizes for title/subtitle/body/caption).
- Color: Fluent neutrals for surfaces, with the Microsoft brand blue accent (#0078D4 and
  the Fluent brand ramp) for primary actions and active nav. Status colors: green for
  completed, amber for pending, red for failed.
- Depth & shape: Fluent elevation/shadows on cards and flyouts, 4px corner radius, generous
  consistent spacing on a 4px grid.
- Layout: app shell with a left navigation rail + top header (title, theme toggle), content
  area with cards. Fully responsive down to mobile.
- Motion: subtle, purposeful transitions (hover, focus, panel open) — no gratuitous
  animation.
- Accessibility: semantic HTML, labelled form fields, visible focus rings, AA color
  contrast, keyboard navigability.
Use CSS custom properties (design tokens) for color/spacing/typography so the theme is
consistent and the light/dark toggle is trivial. Avoid generic "Bootstrap-looking" UI.
</design>

<engineering_principles>
- Keep it simple and focused: build only the views and services described. No speculative
  abstractions, no extra libraries, no premature generalization.
- Strong typing end to end: no `any`. Model the API with interfaces/enums.
- One responsibility per file; small standalone components; a service for HTTP.
- Handle every async state explicitly: loading, success, empty, error (incl. 429).
- Do not hard-code data to fake a working screen — every view must use the real API via the
  service. If the backend is down, show an honest connection error.
- If a Fluent integration detail is genuinely blocking, tell me and use the CSS-token
  fallback rather than silently shipping a non-Fluent look.
</engineering_principles>

<workflow>
Work in order and keep me oriented with short progress notes:
1. Plan: propose the folder structure (frontend/ app shell, routes, components, services,
   models, styles/tokens) and the Fluent integration approach before writing code.
2. Scaffold the Angular app in homework-1/frontend/ and set up the dev proxy
   (proxy.conf.json mapping /api → http://localhost:3000).
3. Build the API service + models, then features 1→5 in small reviewable steps.
4. Apply the Fluent design system and theming.
5. Verify it builds and runs; do a smoke test of each screen against the running backend.
</workflow>

<deliverables>
Produce inside `homework-1/frontend/`:
- The complete Angular 20+ project (standalone, signals, new control flow)
- `proxy.conf.json` wired into the dev server so /api reaches the backend
- A `README.md` (frontend) explaining setup, the Fluent approach, and how it maps to each
  API endpoint
- An update to the top-level `HOWTORUN.md` describing how to run backend + frontend together
- A `.gitignore` excluding `node_modules/`, `dist/`, and `.angular/`
Also ensure the demo and screenshots cover the running UI for `docs/screenshots/`.
</deliverables>

<definition_of_done>
Complete only when ALL are true:
- `npm install` then `ng serve` (or `npm start`) launches the app and it loads with no
  console errors.
- With the backend running, every endpoint in <api_contract> is exercisable from the UI and
  shows correct results.
- Validation errors from POST /transactions render as per-field messages; 404 and 429 have
  dedicated, friendly states.
- The UI visibly follows Microsoft Fluent 2 (typography, brand-blue accent, elevation,
  light/dark toggle) and is responsive.
- TypeScript strict passes with no `any`; the production build (`ng build`) succeeds.
- README and HOWTORUN explain running backend + frontend together.
</definition_of_done>

<self_check>
Before declaring the work finished, run the build and open each screen against the running
backend, and verify every item in <definition_of_done>. List anything failing and fix it.
Do not report success for anything you have not actually executed.
</self_check>

<!-- END PROMPT -->

---

## 📚 Appendix — Best practices baked into this prompt

**Anthropic prompt-engineering techniques** (source: *Prompting best practices*):
`<role>` for persona; `<context>` for motivation/grading; XML tags for unambiguous
structure; positive, concrete instructions; explicit `<engineering_principles>` to prevent
over-engineering and hard-coding; `<self_check>` to force real verification; and a
checkable `<definition_of_done>` as success criteria.

**Angular 20+ best practices** reflected in `<tech_stack>`: standalone components (default
since v17), signals for state with RxJS only at the HTTP boundary, the new `@if`/`@for
(track)`/`@switch`/`@defer` control flow, `inject()` DI, `OnPush`/zoneless change
detection, lazy-loaded routes, and strict typing.

**Microsoft Fluent design** in `<design>`: built on the official `@fluentui/web-components`
(Fluent 2) integrated via Angular's `CUSTOM_ELEMENTS_SCHEMA`, with a Fluent-token CSS
fallback — Segoe UI type ramp, Microsoft brand-blue accent, Fluent elevation, and design
tokens driving a light/dark theme.

**Sources:**
- Anthropic — Prompting best practices: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Microsoft — Use Fluent UI Web Components with Angular: https://learn.microsoft.com/en-us/fluent-ui/web-components/integrations/angular
- Angular — official docs & roadmap: https://angular.dev/roadmap
