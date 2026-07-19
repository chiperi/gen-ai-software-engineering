# Windsurf rules — Virtual Card Lifecycle

Source of truth: `specifications/ai/AGENTS.md`. Condensed always-on guardrails below (regulated FinTech).

- **PAN/CVV never** leave the vault boundary — code, logs, traces, metrics, tests, URLs. Use `network_token` + `last4`.
- **Money** = integer minor units / `Decimal`, one currency per card, compared in minor units. No `float`.
- **State machine only** — legal transitions (BR-001/002), `CLOSED` terminal; illegal ⇒ stable error.
- **Idempotent** writes (`Idempotency-Key`) + **optimistic concurrency** (`If-Match`/ETag).
- **Audit** every state change in the same transaction (outbox); actor + reason + before→after.
- **Deny by default**, SoD; SCA + role for close / lifting a compliance freeze.
- **Fail closed** on ambiguity/dependency loss; stable error codes; no sensitive error detail.
- Style: `mypy --strict`, Pydantic at boundaries, UTC, opaque ids; Conventional Commits `(T-0xx)`; one task/PR.
- Avoid: scope creep, silent contract/requirement changes (need an ADR), secrets in code, `audit_events` mutation.
