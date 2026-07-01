#!/usr/bin/env bash
# One-command launcher for Homework 1: starts the backend (:3000) and the frontend
# (:4200) together, waits for them, seeds sample data, and opens the browser.
# Press Ctrl+C once to stop both.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
LOGS="$ROOT/.logs"
API="http://localhost:3000"
UI="http://localhost:4200"

BACK_PID=""
FRONT_PID=""

cleanup() {
  echo ""
  echo "⏹  Stopping…"
  [ -n "$FRONT_PID" ] && kill "$FRONT_PID" 2>/dev/null
  [ -n "$BACK_PID" ] && kill "$BACK_PID" 2>/dev/null
  # safety net: free the ports even if child processes were re-parented
  for port in 3000 4200; do
    pids="$(lsof -ti "tcp:$port" 2>/dev/null || true)"
    [ -n "$pids" ] && kill $pids 2>/dev/null
  done
  exit 0
}
trap cleanup INT TERM

# --- prerequisites ---
for cmd in java mvn node npm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "✗ '$cmd' not found. This project needs JDK 17+, Maven, and Node.js."
    exit 1
  fi
done

mkdir -p "$LOGS"

# --- install frontend deps on first run ---
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "📦 Installing frontend dependencies (first run, may take a minute)…"
  (cd "$FRONTEND" && npm install) || { echo "✗ npm install failed."; exit 1; }
fi

# --- start backend ---
echo "🚀 Starting backend  → $API   (logs: .logs/backend.log)"
( cd "$BACKEND" && mvn spring-boot:run -Dspring-boot.run.fork=false ) > "$LOGS/backend.log" 2>&1 &
BACK_PID=$!

printf "⏳ Waiting for backend"
for _ in $(seq 1 90); do
  if curl -s -o /dev/null "$API/transactions"; then echo " — ready"; break; fi
  if ! kill -0 "$BACK_PID" 2>/dev/null; then
    echo ""; echo "✗ Backend failed to start. Last log lines:"; tail -n 20 "$LOGS/backend.log"; cleanup
  fi
  printf "."; sleep 1
done

# --- seed sample data ---
if [ -f "$ROOT/demo/seed.sh" ]; then
  echo "🌱 Seeding sample transactions…"
  bash "$ROOT/demo/seed.sh" "$API" >/dev/null 2>&1 || echo "   (seeding skipped)"
fi

# --- start frontend ---
echo "🎨 Starting frontend → $UI   (logs: .logs/frontend.log)"
( cd "$FRONTEND" && npm start ) > "$LOGS/frontend.log" 2>&1 &
FRONT_PID=$!

printf "⏳ Waiting for frontend"
for _ in $(seq 1 120); do
  if curl -s -o /dev/null "$UI"; then echo " — ready"; break; fi
  if ! kill -0 "$FRONT_PID" 2>/dev/null; then
    echo ""; echo "✗ Frontend failed to start. Last log lines:"; tail -n 20 "$LOGS/frontend.log"; cleanup
  fi
  printf "."; sleep 1
done

command -v open >/dev/null 2>&1 && open "$UI" || true

echo ""
echo "✅ Everything is running:"
echo "   • Frontend UI : $UI"
echo "   • Backend API : $API"
echo "   • Live logs   : tail -f .logs/backend.log .logs/frontend.log"
echo ""
echo "Press Ctrl+C to stop both."

# stream combined logs; Ctrl+C triggers cleanup
tail -f "$LOGS/backend.log" "$LOGS/frontend.log"
