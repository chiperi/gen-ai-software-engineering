#!/usr/bin/env bash
# Seeds the running Banking API (http://localhost:3000) with sample transactions.
# Usage:  bash demo/seed.sh    (backend must be running)
set -e
BASE="${1:-http://localhost:3000}"

post() {
  curl -s -X POST "$BASE/transactions" \
    -H "Content-Type: application/json" \
    -d "$1" > /dev/null && echo "  ✓ $1"
}

echo "Seeding sample transactions into $BASE ..."
post '{"fromAccount":"ACC-00000","toAccount":"ACC-12345","amount":500.00,"currency":"USD","type":"deposit"}'
post '{"fromAccount":"ACC-00000","toAccount":"ACC-12345","amount":1250.75,"currency":"USD","type":"deposit"}'
post '{"fromAccount":"ACC-12345","toAccount":"ACC-67890","amount":100.50,"currency":"USD","type":"transfer"}'
post '{"fromAccount":"ACC-12345","toAccount":"ACC-99001","amount":75.00,"currency":"USD","type":"transfer"}'
post '{"fromAccount":"ACC-12345","toAccount":"ACC-00000","amount":50.00,"currency":"USD","type":"withdrawal"}'
post '{"fromAccount":"ACC-00000","toAccount":"ACC-67890","amount":900.00,"currency":"EUR","type":"deposit"}'
post '{"fromAccount":"ACC-67890","toAccount":"ACC-55512","amount":300.00,"currency":"EUR","type":"transfer"}'
post '{"fromAccount":"ACC-55512","toAccount":"ACC-00000","amount":120.25,"currency":"GBP","type":"withdrawal"}'
echo "Done. Open http://localhost:4200 (or GET $BASE/transactions)."
