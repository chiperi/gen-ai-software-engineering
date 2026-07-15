# Technical Plan: Virtual Card Lifecycle

**Stack:** Python 3.12+ · FastAPI + Pydantic v2 · PostgreSQL · lint `ruff` · tests `pytest`
**Owner:** Solution Architect · **Derived from:** `product/specs/001-feature/spec.md`
**Governs:** `contracts/`, `delivery/tasks.md` · **Constrained by:** [[00-constitution]], [[nfr]], [[domain-business-rules]]

> HOW we build what the spec asks for. Every choice here traces to a requirement and is expected to
> hold under the fitness functions ([[fitness-functions]]). Significant choices are recorded as ADRs
> in `decisions/`.

## 1. Architecture overview

A single **card-lifecycle service** (modular monolith, not microservices — see [[adr-0001]]) exposing
a synchronous REST API for control-plane actions and a small **evaluate** endpoint on the hot auth
path. It owns lifecycle state, limits, an immutable transaction read model, and an append-only audit
trail. It depends on external services (vault, KYC, funding, fraud, identity) it does not own.

```
                         ┌─────────────────────────────────────────────┐
   end-user / ops  ──▶   │  API layer (FastAPI)                         │
   (authenticated)       │   ├─ lifecycle routes (issue/activate/...)   │
                         │   ├─ evaluate route (state+limits, hot path) │
   card network  ──▶     │   └─ read routes (transactions)              │
   (evaluate)            │  ─────────────────────────────────────────  │
                         │  Application services                        │
                         │   ├─ StateMachine (single transition fn)     │
                         │   ├─ LimitEngine (validate + enforce)        │
                         │   ├─ IdempotencyGuard  ├─ ConcurrencyGuard   │
                         │   └─ AuditOutbox                             │
                         │  ─────────────────────────────────────────  │
   fraud events  ──▶     │  Adapters: VaultClient · KycClient ·         │
   (AsyncAPI)            │            FundingClient · Fraud consumer    │
                         │  ─────────────────────────────────────────  │
                         │  Postgres: cards · card_transactions ·       │
                         │            audit_events · idempotency_keys   │
                         └─────────────────────────────────────────────┘
```

## 2. Component responsibilities

| Component | Responsibility | Serves |
|-----------|----------------|--------|
| API layer | Validate input, authN/authZ, map errors to stable codes, enforce `Idempotency-Key` + `If-Match` | FR-060/061/063 |
| StateMachine | The **only** place transitions happen; rejects illegal ones | FR-010/011/050/051, BR-001/002 |
| LimitEngine | Validate limits on write; enforce on `evaluate` with window math | FR-030–033, BR-006–009, D-01/D-03 |
| IdempotencyGuard | Persist key→response; replay returns original | FR-060, BR-010 |
| ConcurrencyGuard | Optimistic version per card (`If-Match`/ETag) | FR-061, BR-014 |
| AuditOutbox | One audit event per change, same tx / transactional outbox | FR-062, P3 |
| VaultClient | Tokenize PAN → `network_token`+`last4`; never returns PAN to us | FR-003, BR-020 |
| Fraud consumer | Idempotent compliance-freeze on `fraud.suspected` | FR-025, BR-005 |

## 3. Data model (authoritative store: PostgreSQL)

- **cards**: `card_id` (UUIDv7, PK), `owner_id`, `funding_account_id`, `currency`, `state`
  (`CREATED|ACTIVE|FROZEN|CLOSED`), `freeze_type` (`null|user|compliance`), `network_token`,
  `last4`, `limits` (jsonb: per_transaction/daily/monthly minor units), `version` (int, optimistic),
  `created_at`, `updated_at` (UTC). **No PAN/CVV columns — ever.**
- **card_transactions** (read model, immutable): `txn_id` (UUIDv7), `card_id`, `amount_minor`,
  `currency`, `merchant_descriptor`, `status`, `occurred_at` (UTC). Append-only; corrections are new rows.
- **audit_events** (append-only): `event_id`, `card_id`, `actor_id`, `actor_role`, `action`,
  `before`, `after`, `reason`, `correlation_id`, `at` (UTC), `prev_hash`/`hash` (tamper-evidence chain).
- **idempotency_keys**: `key`, `endpoint`, `actor_id`, `request_hash`, `response_snapshot`,
  `created_at`, TTL. Unique on (`key`,`endpoint`,`actor_id`).

Constraints: `state` + `freeze_type` combination checked; monetary columns are `BIGINT` minor units;
optimistic `version` bumped on every write.

## 4. Key mechanisms

- **Transition function** `apply(card, action, ctx) -> (card', event)` is pure over current state;
  the API never mutates `state` directly. Illegal action ⇒ `IllegalTransition` (FR-011).
- **Idempotency**: middleware computes `request_hash`; on repeat key returns stored
  `response_snapshot` with at-most-once effect ([[adr-0003]]).
- **Concurrency**: read returns `ETag = version`; writes require `If-Match`; mismatch ⇒ `409
  version_conflict` ([[adr-0004]]).
- **Audit via transactional outbox** ([[adr-0002]]): the state change and its audit event commit
  atomically; a publisher ships events; a state change without an audit row is impossible.
- **Limit windows**: calendar day/month in account tz (D-01); comparisons integer minor units,
  inclusive at `==` (D-03).

## 5. Test strategy (pytest)

| Level | What | Tool |
|-------|------|------|
| Unit | StateMachine (all legal+illegal transitions), LimitEngine (validation + boundary D-03), money helpers | pytest, hypothesis (property tests) |
| Integration | Endpoints against a real Postgres (testcontainers), idempotency + concurrency, audit-per-change | pytest + testcontainers |
| Contract | Requests/responses conform to `contracts/openapi.yaml`; events to `asyncapi.yaml` | schemathesis / spectral (FF) |
| E2E | issue→activate→set-limits→freeze→unfreeze→close happy path + E-04/E-05/E-14 | pytest |
| Security | SAST (bandit), deps (pip-audit), secret scan, PAN-leak grep over logs/fixtures | CI gates |
| Fitness | [[fitness-functions]] FF-001…FF-005 run in CI | CI |

Coverage gate ≥ 85% lines / ≥ 90% on StateMachine + LimitEngine (the risk core).

## 6. Cross-cutting

- **AuthZ**: deny-by-default; ownership check for users; explicit ops scopes; SCA gate on close /
  compliance-unfreeze (FR-050/052, P5).
- **Fail closed** (P6): dependency loss ⇒ deny/hold + retryable error; evaluate defaults to decline.
- **Observability**: [[observability]] (RED metrics, JSON logs w/o PII, trace-id propagation, SLOs).
- **Security posture**: [[threat-model]] (STRIDE), PAN out of scope by construction.

## 7. Rejected / deferred

- Microservices split per capability — deferred; premature for one bounded context ([[adr-0001]]).
- Event-sourcing the card aggregate — deferred; audit outbox + version gives auditability without
  the operational cost. Revisit if temporal replay becomes a hard requirement.
