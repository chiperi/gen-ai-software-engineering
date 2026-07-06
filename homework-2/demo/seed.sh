#!/usr/bin/env bash
# Seed the running backend with the sample tickets (auto-classified).
# Usage: bash demo/seed.sh [API_BASE]   (default http://localhost:3000)
set -euo pipefail

API="${1:-http://localhost:3000}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🌱 Seeding sample tickets into $API …"
curl -sf -X POST "$API/tickets/import?auto_classify=true" \
  -F "file=@$ROOT/sample_tickets.csv" >/dev/null && echo "  ✓ sample_tickets.csv (50)"
curl -sf -X POST "$API/tickets/import?auto_classify=true" \
  -F "file=@$ROOT/sample_tickets.json" >/dev/null && echo "  ✓ sample_tickets.json (20)"
curl -sf -X POST "$API/tickets/import?auto_classify=true" \
  -F "file=@$ROOT/sample_tickets.xml" >/dev/null && echo "  ✓ sample_tickets.xml (30)"

COUNT=$(curl -sf "$API/tickets" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
echo "✅ Done — $COUNT tickets in the store."
