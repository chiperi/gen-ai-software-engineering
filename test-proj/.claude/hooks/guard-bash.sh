#!/usr/bin/env bash
set -euo pipefail

cmd=$(jq -r '.tool_input.command // empty')

deny() {
  echo "🚨🙅 NOPE! The bash bouncer says: $1 — try again, but nicer. 🧯" >&2
  exit 2   # exit 2 => Claude sees stderr and must adjust
}

case "$cmd" in
  *"rm -rf /"*)         deny "💀 you just tried to delete the whole planet" ;;
  *"git push --force"*) deny "🔫 force push detected, use --force-with-lease" ;;
  *"git reset --hard"*) deny "🕳️ that shreds uncommitted work, stash it first" ;;
  *"curl"*"| sh"*)      deny "🎣 curl-pipe-to-shell is how goblins get in" ;;
  *".env"*)             deny "🔐 secrets are off limits, no peeking" ;;
esac

echo "✅🛡️ Bash guard says this one looks harmless. Carry on! 🚀"
exit 0
