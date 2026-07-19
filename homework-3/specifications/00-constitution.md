# Project Constitution — Virtual Card Lifecycle

Immutable principles at the highest level. Everything downstream — `product/specs/`,
`architecture/`, `decisions/`, `delivery/` — must be consistent with these. A change to a
principle here is a governance event and requires a new ADR that supersedes the old rule.

Scope of this constitution: a **regulated virtual card lifecycle service** (issue → activate →
freeze/unfreeze → set spending limits → view transactions → close) serving **end-users** and an
**internal ops/compliance** view. See [[domain-glossary]] for terms and [[domain-business-rules]]
for the rules these principles constrain.

## 1. Money is exact and never floats
Monetary amounts are stored and computed as **minor units** (integer cents) or `Decimal` — never
IEEE-754 floats. Every amount carries an explicit ISO-4217 currency. Cross-currency arithmetic is
forbidden without an explicit, audited FX step. Rounding is banker's rounding, applied once, at a
documented boundary.

## 2. Sensitive data has hard boundaries
The full Primary Account Number (PAN), CVV, and full track data **never** enter our logs, traces,
metrics, analytics, error reports, URLs, or non-PCI datastores. Card identity is surfaced to users
and ops only as a network token and the last four digits (`last4`). CVV is never stored after
authorization. PII and card data are encrypted at rest and in transit. This principle overrides
convenience, debuggability, and every "just this once."

## 3. Every state change is auditable and attributable
Every lifecycle transition (issue, activate, freeze, unfreeze, limit change, close) produces an
**append-only, tamper-evident audit event** recording who (actor + role), what, when (UTC),
before → after, correlation/request id, and reason. Audit records are write-once, retained per the
regulatory retention window, and never deleted by application code. If it isn't audited, it didn't
happen.

## 4. Writes are idempotent; state transitions are explicit
Every state-changing operation requires a caller-supplied **idempotency key** and is safe to retry:
the same key returns the same result and causes at most one effect. The card lifecycle is a defined
**state machine**; only declared transitions are legal, and illegal transitions fail loudly with a
stable error code — they are never silently ignored or coerced.

## 5. Least privilege and separation of duties
Access is deny-by-default and role-scoped. End-users act only on **their own** cards. Ops/compliance
have read plus narrowly-scoped intervention powers (e.g. compliance freeze) and **cannot** perform a
user's spend actions. Sensitive/irreversible actions (e.g. permanent close) require the appropriate
role and are always audited (see Principle 3).

## 6. Fail closed, degrade safely
When a dependency (ledger, token vault, fraud service) is unavailable or a check is ambiguous, the
system chooses the **safe** outcome: deny the spend, hold the state, surface a clear error — never
"fail open" into unlimited spend or an unauthenticated action. User-facing errors are actionable and
leak no sensitive detail.

## 7. Specification precedes code; traceability is mandatory
No feature is built without a spec. Every requirement traces forward to a design decision, a task,
and a test ([[traceability-matrix]]); every task traces back to a mid-level objective. Non-functional
targets are stated as **numbers**, not adjectives, and are verified in CI (see
[[fitness-functions]]).

## 8. Privacy and data minimization by design
Collect the minimum data needed, keep it the minimum time needed, and honor data-subject rights
(access, rectification, erasure where lawful). Data classification (see [[threat-model]]) drives
storage, masking, and retention — not the other way around.
