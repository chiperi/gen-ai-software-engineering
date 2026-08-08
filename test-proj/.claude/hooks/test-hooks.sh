#!/usr/bin/env bash
# Test harness for the project hooks.
#
#   ./test-hooks.sh
#
# Feeds crafted PreToolUse/PostToolUse payloads into the hook scripts and
# compares the exit code with the expectation declared in test-cases.txt.
# Cases live in a data file on purpose: this script must never contain the
# dangerous literals itself, or guard-bash.sh blocks the harness from running.

set -uo pipefail

here=$(cd "$(dirname "$0")" && pwd)
pass=0
fail=0

report() { # status label detail
  if [ "$1" = ok ]; then
    pass=$((pass + 1))
    printf '  \033[32mPASS\033[0m  %-30s %s\n' "$2" "$3"
  else
    fail=$((fail + 1))
    printf '  \033[31mFAIL\033[0m  %-30s %s\n' "$2" "$3"
  fi
}

echo "PreToolUse — guard-bash.sh"
while IFS='|' read -r expect label command; do
  case "$expect" in '#'*|'') continue ;; esac
  expect=$(echo "$expect" | xargs)
  label=$(echo "$label" | xargs)
  command="${command# }"

  printf '%s' "$command" | jq -Rs '{tool_input: {command: .}}' |
    "$here/guard-bash.sh" >/dev/null 2>&1
  code=$?

  got=ALLOW
  [ "$code" -eq 2 ] && got=DENY

  if [ "$got" = "$expect" ]; then
    report ok "$label" "$expect"
  else
    report no "$label" "expected $expect, got $got (exit $code)"
  fi
done <"$here/test-cases.txt"

echo
echo "PostToolUse — format.sh"
tmp=$(mktemp -d)
trap 'rm -r -- "$tmp"' EXIT

check_format() { # label file_path expect_substring
  local out
  out=$(echo "{\"tool_input\":{\"file_path\":\"$2\"}}" | "$here/format.sh" 2>&1)
  local code=$?
  if [ "$code" -ne 0 ]; then
    report no "$1" "hook exited $code"
  elif [ -n "$3" ] && [[ "$out" != *"$3"* ]]; then
    report no "$1" "expected output matching '$3', got: ${out:-<empty>}"
  else
    report ok "$1" "${out:-<no output>}"
  fi
}

printf '#    Sloppy   Title\n\n\n*   a\n' >"$tmp/messy.md"
printf 'x   =   1\n' >"$tmp/messy.py"
printf 'plain\n' >"$tmp/plain.txt"

check_format "markdown gets formatted" "$tmp/messy.md" "Prettier"
check_format "python gets formatted" "$tmp/messy.py" "Ruff"
check_format "unknown ext passes through" "$tmp/plain.txt" "No formatter"
check_format "missing file is a no-op" "$tmp/gone.md" ""
check_format "empty payload is a no-op" "" ""

# The claim in the output must match what happened on disk.
if [ "$(cat "$tmp/messy.md")" = "$(printf '#    Sloppy   Title\n\n\n*   a\n')" ]; then
  report no "markdown really changed" "hook reported success but file is byte-identical"
else
  report ok "markdown really changed" "file was rewritten"
fi

echo
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ]
