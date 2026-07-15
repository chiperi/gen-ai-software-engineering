#!/usr/bin/env bash
# One-time dev setup (macOS / Linux).
set -euo pipefail
command -v just >/dev/null || echo "tip: install 'just' (https://github.com/casey/just) for task shortcuts"
python3 -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate
pip install --upgrade pip
pip install -e ".[dev]"
pre-commit install
echo "✅ setup complete — run 'just check' to verify the quality gates"
