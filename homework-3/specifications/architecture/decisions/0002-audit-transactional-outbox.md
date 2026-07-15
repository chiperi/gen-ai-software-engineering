# ADR-0002: Auditability via transactional outbox

**Status:** accepted
**Date:** 2026-07-16
**Deciders:** Solution Architect · **Relates to:** [[00-constitution]] P3, spec FR-062, [[plan]] §4

## Context
Constitution P3 requires that **every** state change is auditable and attributable, and that a state
change without an audit record is impossible. Options: (a) app-level "log after write" (racy, can be
lost on crash), (b) event sourcing (high cost), (c) transactional outbox.

## Decision
Write the state change and its `audit_events` row in the **same database transaction** (outbox
pattern). A separate publisher relays audit/domain events (`card.*`) to the message bus for
downstream consumers. Audit rows form a hash chain (`prev_hash`→`hash`) for tamper-evidence and are
append-only (no UPDATE/DELETE grant to the app role).

## Consequences
- (+) Atomicity: no committed state change can lack an audit row (satisfies P3, FR-062).
- (+) Tamper-evidence via hash chain; append-only enforced at the DB grant level.
- (+) Reliable event publication decoupled from the request path.
- (−) Requires an outbox publisher + dedup on the consumer side (idempotent by `event_id`).
- (−) Slight write amplification; acceptable vs. the compliance requirement.
