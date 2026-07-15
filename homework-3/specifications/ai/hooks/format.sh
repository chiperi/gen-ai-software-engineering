#!/usr/bin/env bash
# PostToolUse (Edit|Write) hook — format changed files. Registered in settings.json → hooks.PostToolUse.
# Runs the harness (not the model), so it is a hard guardrail for consistent formatting.
set -euo pipefail
if command -v ruff >/dev/null 2>&1; then
  ruff format . >/dev/null 2>&1 || true
  ruff check --fix . >/dev/null 2>&1 || true
fi
exit 0
