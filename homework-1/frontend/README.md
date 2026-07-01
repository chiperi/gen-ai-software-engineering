# 💻 Frontend — Banking Transactions UI

Angular 22 (standalone, signals, new control flow, zoneless) single-page app that provides
a UI for every endpoint of the Banking API, styled with a **Microsoft Fluent 2** design
system (CSS design tokens — Segoe UI, brand blue `#0078D4`, elevation, light/dark theme).
Its purpose is **visual verification** of the backend.

## Prerequisites

- Node.js 20+ and npm
- The backend running on **http://localhost:3000** (see `../HOWTORUN.md`)

## Run

```bash
cd homework-1/frontend
npm install     # required — install on YOUR machine (do not reuse a node_modules from elsewhere)
npm start       # ng serve on http://localhost:4200
```

The dev server proxies `/api/*` to the backend (`proxy.conf.json`, wired into
`angular.json`), so no CORS configuration is needed.

```bash
npm run build   # production build into dist/
```

## How it maps to the API

| View (route) | API endpoint(s) |
|---|---|
| Transactions (`/transactions`) — table + filters + CSV export | `GET /transactions` (accountId/type/from/to), `GET /transactions/export?format=csv` |
| New transaction (`/transactions/new`) — reactive form + validation | `POST /transactions` (maps `400 details[]` to per-field errors) |
| Transaction details (`/transactions/:id`) | `GET /transactions/{id}` (404 → empty state) |
| Account tools (`/accounts`) — balance, summary, interest | `GET /accounts/{id}/balance`, `/summary`, `/interest?rate=&days=` |
| Global | `429` surfaced as a toast via an HTTP interceptor |

## Architecture

- **Standalone components** with lazy-loaded routes (`app.routes.ts`).
- **Signals** for all view state; RxJS only at the `HttpClient` boundary
  (`services/transaction-api.ts`).
- **Typed** models in `models/transaction.ts`; no `any`.
- **Fluent 2** tokens in `src/styles.css`; theme toggled via `data-theme` on `<html>`.
- Functional **HTTP interceptor** (`core/rate-limit-interceptor.ts`) + toast service for UX.

> Note: this folder was scaffolded and type-checked with Angular CLI 22; `npm run build`
> completes with no errors. Always run `npm install` on your own machine.
