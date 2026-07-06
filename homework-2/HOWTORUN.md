# ▶️ How to Run

Intelligent Customer Support System — Homework 2.
Backend: **Python + FastAPI** · Frontend: **React + Vite**.

## Prerequisites

- **Python 3.13** (`python3.13 --version`). See the note below about 3.14.
- **Node.js 18+** and npm (for the frontend).

> **Python version:** pinned deps ship prebuilt wheels for 3.13. On Python 3.14
> pip tries to compile `pydantic-core` from source (Rust); use 3.13 to avoid it.

## ⚡ Quick start (one command)

From `homework-2/`:

```bash
./run.sh
```

It creates the Python venv and installs deps on first run, starts the backend on
`:3000`, seeds the sample tickets, starts the frontend on `:5173`, opens the
browser, and stops everything on **Ctrl+C**. The manual steps below are the
alternative if you prefer to run each part yourself.

## 1) Backend — http://localhost:3000

```bash
cd backend
python3.13 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn app.main:app --port 3000
```

- Health: `http://localhost:3000/health` → `{"status":"ok"}`
- API docs (Swagger UI): `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

Quick check:

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"CUST-1","customer_email":"a@b.com","customer_name":"A B",
       "subject":"Cannot log in","description":"My password reset link is broken and I can not access."}'

curl http://localhost:3000/tickets
```

## 2) Seed sample data (optional)

With the backend running:

```bash
bash demo/seed.sh          # imports sample_tickets.csv with auto-classification
```

Or regenerate the sample/invalid files first:

```bash
python3 demo/generate_sample_data.py
```

## 3) Frontend — http://localhost:5173

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` to the
backend on `:3000`, so no CORS setup is needed. (Requires the backend running.)

## 4) Tests & coverage

```bash
cd backend
./.venv/bin/pytest             # 58 tests, coverage gate ≥85%
open htmlcov/index.html        # HTML coverage report
```

Frontend production build (type-check + bundle):

```bash
cd frontend
npm run build
```

## Summary of endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tickets` | Create a ticket (`?auto_classify=true`) |
| POST | `/tickets/import` | Bulk import CSV/JSON/XML |
| GET | `/tickets` | List (filter by category/priority/status) |
| GET | `/tickets/{id}` | Get one |
| PUT | `/tickets/{id}` | Update |
| DELETE | `/tickets/{id}` | Delete |
| POST | `/tickets/{id}/auto-classify` | Classify a ticket |
| GET | `/health` | Liveness |

See [docs/API_REFERENCE.md](docs/API_REFERENCE.md) for full request/response
examples.
