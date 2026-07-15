# hooks/

Event scripts (registered in `settings.json` → `hooks`).
Events: PreToolUse · PostToolUse · Stop · UserPromptSubmit · SessionStart, etc.
The HARNESS runs them (not the model) — so they're suited to hard guardrails:
format/lint after edits, prohibitions, notifications.
