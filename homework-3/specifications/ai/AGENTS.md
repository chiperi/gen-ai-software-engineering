# AGENTS.md — Virtual Card Lifecycle

> Single source of truth for AI agents (and humans) working in this repo. `CLAUDE.md` / `GEMINI.md`
> are symlinks to this file. Editor rule files (`ai/rules/*`, `ai/editors/*`) link here rather than
> restating it. If a rule here conflicts with a request, **the rule wins** — surface the conflict.

## 1. Project overview
A **regulated virtual card lifecycle service**: issue → activate → freeze/unfreeze → set spending
limits → view transactions → close, for end-users and ops/compliance. Full spec:
`product/specs/001-feature/spec.md`. Principles: `00-constitution.md`. Terms & rules:
`knowledge/`. **This is a specification bundle** — when implementing, follow the spec and ADRs; do
not invent behavior.

## 2. Tech stack (assumed)
- **Runtime:** Python 3.12+
- **API:** FastAPI + Pydantic v2 · **DB:** PostgreSQL · **Money:** integer minor units / `Decimal`
- **Lint/format:** `ruff` + `ruff format` · **Types:** `mypy` (strict) · **Tests:** `pytest` (+ `hypothesis`, `testcontainers`)
- **Contracts:** OpenAPI 3.1 (`contracts/openapi.yaml`), AsyncAPI 3.0 (`contracts/asyncapi.yaml`)
- **CI gates:** ruff, mypy, pytest+coverage, bandit, pip-audit, gitleaks, spectral, schemathesis, import-linter

## 3. Workflow (spec-driven — do not skip levels)
`spec (product/specs) → architecture (plan/ADR/contracts/nfr) → tasks (delivery/) → code+tests`.
Pick tasks from `delivery/tasks.md` in wave order; do **one task per PR**; self-verify before handing off.

## 4. Domain rules the agent must respect (non-negotiable)
These come from `00-constitution.md` and `knowledge/domain-business-rules.md`. Cite them in code/PRs.
- **Never handle the full PAN or CVV.** We store only `network_token` + `last4`. PAN/CVV must never
  appear in code, logs, traces, metrics, tests, fixtures, errors, or URLs. (P2, BR-020, FF-006)
- **Money is never a float.** Integer minor units or `Decimal`; one currency per card; compare in
  minor units; format only at the presentation edge. (P1, ADR-0005, FF-008)
- **Every state change is audited.** Write the audit event in the same transaction as the change
  (outbox). No state change without an audit row. (P3, ADR-0002, FF-007)
- **Writes are idempotent.** Honor `Idempotency-Key`; a replay returns the original result with
  at-most-once effect. (P4, ADR-0003)
- **Concurrency is optimistic.** Reads return `ETag`; writes require `If-Match`; never
  last-writer-wins on state. (ADR-0004)
- **Only legal transitions.** Go through the single state-machine function; illegal transition ⇒
  stable error, never a silent coerce. `CLOSED` is terminal. (BR-001/002)
- **Deny by default; separation of duties.** Users act only on their own cards; ops/compliance can't
  spend; sensitive actions (close, lift compliance freeze) need SCA + role. (P5, BR-005/012)
- **Fail closed.** On dependency loss or ambiguity, deny/hold — never fail open into spend. (P6)

## 5. Code style & conventions
- Type-hint everything; `mypy --strict` clean. Pydantic models for all I/O; validate at the boundary.
- Function/vars `snake_case`; classes `PascalCase`; stable **error codes** as an enum (see OpenAPI `Error`).
- Money helpers only — no ad-hoc arithmetic on amounts. IDs opaque (UUIDv7/ULID), never sequential.
- Timestamps UTC ISO-8601 internally. Small pure functions for domain logic; side effects at the edges.
- Conventional Commits with task id: `feat: enforce daily limit window (T-025)`.
- Small PRs; formatting via pre-commit; lint/type/tests via CI. No secrets in code — use env/secret store.

## 6. Testing & verification expectations
- Every task's **DoD** in `delivery/tasks.md` must be met; map tests to the FR/edge-case they cover.
- Coverage ≥ 85% overall, ≥ 90% on `StateMachine` + `LimitEngine` (NFR-016).
- Required test types: unit (state machine, money, validation), integration (endpoints + Postgres),
  contract (schemathesis/spectral), e2e (issue→…→close), security (SAST/SCA/secret + PAN grep).
- Self-verify loop: `ruff` → `mypy` → `pytest` → contract check before marking a task done.
- A change to a requirement/architecture is **not** an agent decision — return it to BA/SA (add an ADR).

## 7. How to treat edge cases (defaults)
Full table: spec §9 (E-01…E-20). Defaults an agent must apply:
- Unknown/ambiguous state or dependency failure → **fail closed** (deny/hold), retryable error, audit it.
- Replay of a write → return original, no new effect. Concurrent write conflict → `409 version_conflict`.
- Invalid limits (negative, non-int, per_tx>daily, currency mismatch) → `422 invalid_limits`, persist nothing.
- Any op on `CLOSED` → stable terminal-state error. Missing SCA on close → `401 sca_required`.
- Empty result sets → return an empty page (200), not an error.

## 8. Guardrails — do NOT
- ❌ Log/persist/return PAN or CVV, or put PII/ids in URLs or query strings.
- ❌ Use floats for money, or mix currencies on one card.
- ❌ Bypass the state machine, idempotency, concurrency, or audit paths "for speed".
- ❌ Widen a scope, refactor broadly, or change contracts/requirements silently.
- ❌ Commit secrets, disable a security/quality gate, or weaken a fail-closed default.
- ❌ Touch `audit_events` with UPDATE/DELETE, or grant the app role permission to.

## 9. Pointers
| Need | File |
|------|------|
| What & why | `product/specs/001-feature/spec.md` |
| Principles | `00-constitution.md` |
| Terms / business rules | `knowledge/domain-glossary.md`, `knowledge/domain-business-rules.md` |
| How (architecture) | `architecture/plan.md` + `architecture/decisions/` |
| Numbers (NFR/SLO) | `architecture/nfr.md`, `architecture/observability.md` |
| Contracts | `contracts/openapi.yaml`, `contracts/asyncapi.yaml` |
| Tasks | `delivery/tasks.md` · **Traceability** `architecture/traceability-matrix.md` |
| Role boundaries | `roles/` |
