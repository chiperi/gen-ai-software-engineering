# GitHub Copilot — repository instructions

> Repo-wide guidance for Copilot / Copilot Chat. **Source of truth is `../AGENTS.md`** — this file
> condenses the FinTech-sensitive defaults so inline suggestions follow them by default. When they
> disagree, `AGENTS.md` and the spec win.

## Context
This repo specifies a **regulated virtual card lifecycle service** (Python 3.12 · FastAPI · Postgres).
Read `product/specs/001-feature/spec.md` and `00-constitution.md` before proposing behavior. This is a
spec bundle: implement to the spec/ADRs, don't invent features.

## Always
- Money as **integer minor units** or `Decimal`; one currency per card; compare in minor units. Never `float`.
- Reference cards by `network_token` + `last4` only. **Never** produce code that logs/stores/returns PAN or CVV.
- Make state-changing operations **idempotent** (`Idempotency-Key`) and **optimistically concurrent** (`If-Match`/ETag).
- Route every card state change through the **single state-machine function**; only legal transitions (BR-001/002).
- Emit an **audit event in the same transaction** as any state change (outbox); actor + reason + before→after.
- **Deny by default**; users act only on their own cards; sensitive actions need SCA + role (SoD).
- **Fail closed** on ambiguity/dependency loss (deny/hold), with a stable error code and no sensitive detail.
- Type-hint everything (`mypy --strict`), Pydantic at the boundary, UTC timestamps, opaque UUIDv7/ULID ids.
- Suggest a matching **test** (map it to the FR / edge case E-xx) with any nontrivial code.

## Never
- ❌ PAN/CVV or PII in logs, traces, metrics, errors, URLs, query strings, or fixtures.
- ❌ Floats for money; cross-currency arithmetic on a single card.
- ❌ Bypassing idempotency / concurrency / audit / state-machine paths.
- ❌ Widening scope, silent broad refactors, or changing contracts/requirements without an ADR.
- ❌ Committing secrets or weakening a security/quality gate or a fail-closed default.
- ❌ UPDATE/DELETE on `audit_events`.

## Commits & PRs
Conventional Commits with the task id: `feat: enforce daily limit window (T-025)`. Small PRs; one task
at a time from `delivery/tasks.md`; self-verify `ruff → mypy → pytest → contract check` before proposing done.

## Stable error codes (use these, not ad-hoc strings)
`kyc_required · illegal_transition · invalid_limits · compliance_freeze_locked · version_conflict ·
sca_required · idempotency_key_reuse · forbidden · invalid_cursor · terminal_state · dependency_unavailable`
(see `contracts/openapi.yaml` → `Error`).
