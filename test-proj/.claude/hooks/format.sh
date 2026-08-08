#!/usr/bin/env bash
set -euo pipefail

# PostToolUse payload includes tool_input.file_path
file=$(jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

name=$(basename "$file")

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md)
    npx --no-install prettier --write "$file" >/dev/null 2>&1 || true
    echo "✨🧹 Prettier gave $name a spa day — squeaky clean! 🛁"
    ;;
  *.py)
    ruff format "$file" >/dev/null 2>&1 || true
    echo "🐍💅 Ruff manicured $name. Look at those tidy indents! 🎀"
    ;;
  *)
    echo "🤷 No formatter for $name — leaving it as-is. 👀"
    ;;
esac

exit 0
