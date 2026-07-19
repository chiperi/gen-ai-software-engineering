# agents.md — AI guidelines (entry point)

> Top-level entry point for the AI/agent guidelines required by the homework. The canonical, full
> version is the single source of truth in the bundle; `CLAUDE.md` / `GEMINI.md` symlink to it.
>
> **Canonical:** [`specifications/ai/AGENTS.md`](specifications/ai/AGENTS.md)
> **Editor / AI rules:** [`specifications/ai/rules/copilot-instructions.md`](specifications/ai/rules/copilot-instructions.md) ·
> [`specifications/ai/editors/`](specifications/ai/editors/) (Cursor, Windsurf, Cline, Junie, Aider) ·
> [`specifications/ai/rules/user-rules.md`](specifications/ai/rules/user-rules.md)

## Tech stack (assumed)
Python 3.12+ · FastAPI + Pydantic v2 · PostgreSQL · `ruff` + `mypy --strict` · `pytest` ·
OpenAPI 3.1 / AsyncAPI 3.0 contracts. CI gates: ruff, mypy, pytest+coverage, bandit, pip-audit,
gitleaks, spectral, schemathesis, import-linter.

## Workflow
Spec-driven, no skipping levels: `spec (product/specs) → architecture (plan/ADR/contracts/nfr) →
tasks (delivery/) → code + tests`. One task per PR from
[`delivery/tasks.md`](specifications/delivery/tasks.md); self-verify before handoff.

## Domain rules the agent must respect (non-negotiable)
Full detail + citations in [`specifications/ai/AGENTS.md`](specifications/ai/AGENTS.md) §4–§8.

- **Never handle full PAN/CVV** — store only `network_token` + `last4`; never in code, logs, traces,
  metrics, tests, errors, or URLs. (constitution P2, BR-020, FF-006)
- **Money is never a float** — integer minor units / `Decimal`, one currency per card. (P1, ADR-0005)
- **Every state change is audited** in the same transaction (outbox); no change without an audit row. (P3, ADR-0002)
- **Writes are idempotent** (`Idempotency-Key`) and **optimistically concurrent** (`If-Match`/ETag). (ADR-0003/0004)
- **Only legal transitions** through the single state-machine function; `CLOSED` is terminal. (BR-001/002)
- **Deny by default + separation of duties**; SCA + role for close / lifting a compliance freeze. (P5, BR-005/012)
- **Fail closed** on ambiguity or dependency loss — never fail open into spend. (P6)

## Testing & verification expectations
Every task's Definition of Done met; coverage ≥ 85% overall, ≥ 90% on state machine + limit engine;
tests mapped to the FR / edge case they cover; self-verify loop `ruff → mypy → pytest → contract check`.

## How the agent must treat edge cases (defaults)
Fail closed on ambiguity/dependency loss (deny/hold, retryable, audited); replay ⇒ original result;
invalid limits ⇒ `422`, persist nothing; any op on `CLOSED` ⇒ terminal error; missing SCA on close ⇒
`401`; empty result sets ⇒ empty page, not an error. Full table:
[`spec` §9](specifications/product/specs/001-feature/spec.md) and
[`AGENTS.md` §7](specifications/ai/AGENTS.md).
