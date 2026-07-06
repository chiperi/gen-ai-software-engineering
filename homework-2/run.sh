#!/usr/bin/env bash
# One-command launcher: starts the FastAPI backend (:3000), seeds sample data,
# and starts the React + Vite frontend (:5173). Ctrl+C stops everything.
# First run creates the Python venv and installs deps (needs internet).
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS="$ROOT/.logs"
API="http://localhost:3000"
WEB="http://localhost:5173"
mkdir -p "$LOGS"

BACK_PID=""

cleanup() {
  echo ""
  echo "⏹  Stopping…"
  [ -n "$BACK_PID" ] && kill "$BACK_PID" 2>/dev/null
  for port in 3000 5173; do
    pids="$(lsof -ti "tcp:$port" 2>/dev/null || true)"
    [ -n "$pids" ] && kill $pids 2>/dev/null
  done
  exit 0
}
trap cleanup INT TERM

need() { command -v "$1" >/dev/null 2>&1 || { echo "✗ '$1' not found — install it and retry."; exit 1; }; }

# ---- pick a Python 3.13 interpreter (3.14 forces a source build of pydantic-core) ----
PY=""
for c in python3.13 python3; do
  if command -v "$c" >/dev/null 2>&1; then PY="$c"; break; fi
done
[ -n "$PY" ] || { echo "✗ Python 3.13 not found."; exit 1; }
need npm

# ---- 1) backend ----
if [ ! -d "$ROOT/backend/.venv" ]; then
  echo "📦 Creating venv + installing backend deps (first run)…"
  ( cd "$ROOT/backend" && "$PY" -m venv .venv && ./.venv/bin/pip install -q --upgrade pip \
      && ./.venv/bin/pip install -q -r requirements.txt ) \
    || { echo "✗ Backend dependency install failed."; exit 1; }
fi

echo "🚀 Starting backend (logs: .logs/backend.log)…"
( cd "$ROOT/backend" && ./.venv/bin/uvicorn app.main:app --port 3000 ) >"$LOGS/backend.log" 2>&1 &
BACK_PID=$!

printf "⏳ Waiting for API on :3000"
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "$API/health"; then echo " — ready"; break; fi
  if ! kill -0 "$BACK_PID" 2>/dev/null; then
    echo ""; echo "✗ Backend exited. Last log lines:"; tail -n 20 "$LOGS/backend.log"; cleanup
  fi
  printf "."; sleep 1
done

# ---- 2) seed sample data ----
if [ -f "$ROOT/demo/seed.sh" ]; then
  echo "🌱 Seeding sample data…"
  bash "$ROOT/demo/seed.sh" "$API" 2>/dev/null || echo "  (seed skipped)"
fi

# ---- 3) frontend ----
[ -d "$ROOT/frontend/node_modules" ] || ( echo "📦 Installing frontend deps (first run)…"; cd "$ROOT/frontend" && npm install )

echo ""
echo "✅ Backend: $API   (docs: $API/docs, health: $API/health)"
echo "   Frontend: $WEB"
echo "   Press Ctrl+C to stop everything."
echo ""

( sleep 4 && command -v open >/dev/null 2>&1 && open "$WEB" ) &
( cd "$ROOT/frontend" && npm run dev )

cleanup
