# Support Tickets — Frontend (React + Vite)

Single-page UI for the Intelligent Customer Support System. It consumes the
FastAPI backend (Tasks 1–2) over REST — no ticket data is hardcoded.

## Features

- **List + filter** tickets by category, priority and status
- **Create / edit** tickets with client-side validation (email, field lengths)
- **Ticket details** including classification result and metadata
- **Bulk import** from CSV / JSON / XML with a success/failure summary
- **Auto-classify** a ticket and view category, priority, confidence, reasoning
- **Toast feedback** for every API success and error
- Responsive layout (desktop + mobile)

## Prerequisites

- Node.js 18+
- The backend running on **http://localhost:3000** (see `../backend`)

## Run

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` to the
backend on `:3000` (see `vite.config.ts`), so no CORS setup is needed.

## Build

```bash
npm run build      # type-check + production build into dist/
npm run preview    # preview the production build
```

## Structure

```
src/
├── api/client.ts        # typed REST wrapper (fetch)
├── types.ts             # TS mirror of the backend model
├── components/          # TicketList, TicketForm, TicketDetail, ImportPanel, Filters, Toast, Badge
├── App.tsx              # dashboard: state + orchestration
├── main.tsx             # entry point
└── styles.css           # responsive styling
```
