# Delivery Tasks: Virtual Card Lifecycle

**Derived from:** `product/specs/001-feature/spec.md` (FR/MO), [[plan]] (design), ADRs, [[nfr]].
**Traceability:** every task cites the FR/MO it serves and appears in [[traceability-matrix]].
Tasks are **atomic** (one PR-sized slice), ordered in **waves** by dependency. Each ends with a
**Definition of Done (DoD)** an implementer can check off. `[ ]` = todo.

> Convention: commits `feat: … (T-0xx)`; a task is done only when its DoD boxes are all checked and
> quality gates ([[fitness-functions]]) are green. No scope creep — extra ideas become new tasks.

---

## Wave 0 — Foundations (scaffold, no business logic yet)

### [ ] T-001 — Service skeleton + health + config
- **Serves:** all · **Design:** [[plan]] §1
- Do: FastAPI app, `/health`, settings (env), structured JSON logging (no PII), correlation-id middleware.
- **DoD:** `GET /health` 200; logs are JSON with `correlation_id`; ruff + mypy clean; CI pipeline runs.

### [ ] T-002 — Database schema + migrations
- **Serves:** MO-2/5/7/8 · **Design:** [[plan]] §3, ADR-0005
- Do: migrations for `cards`, `card_transactions`, `audit_events`, `idempotency_keys`; opaque UUIDv7 ids; `BIGINT` minor-unit amounts; `version` column; **no PAN/CVV columns**; app DB role has no UPDATE/DELETE on `audit_events`.
- **DoD:** migrations apply/rollback; schema review confirms no PAN column (FF-006); grant test: app role cannot UPDATE/DELETE audit rows (T-007 dependency).

### [ ] T-003 — Contracts wired + conformance harness
- **Serves:** all · **Design:** `contracts/`, FF-005
- Do: publish `openapi.yaml`/`asyncapi.yaml`; wire schemathesis + spectral in CI.
- **DoD:** spectral lint passes; schemathesis runs against the app (even if endpoints stubbed); FF-005 job present.

---

## Wave 1 — Core state machine & guards (the risk core)

### [ ] T-010 — Card state machine (single transition function)
- **Serves:** MO-2/6 · **Design:** [[plan]] §4, BR-001/002 · **Verifies:** FR-010/011/050/051
- Do: pure `apply(card, action, ctx) -> (card', event)`; legal transitions only; illegal ⇒ `IllegalTransition`; `CLOSED` terminal.
- **DoD:** unit tests cover **every** legal and illegal transition; property test: post-state ∈ {CREATED,ACTIVE,FROZEN,CLOSED}; ≥ 90% coverage on this module (NFR-016).

### [ ] T-011 — Idempotency guard (ADR-0003)
- **Serves:** MO-7 · **Verifies:** FR-060, BR-010
- Do: middleware storing `(key,endpoint,actor)→request_hash+response`; replay returns original; body mismatch ⇒ `422 idempotency_key_reuse`.
- **DoD:** test E-02 (replay = original, one effect); test different-body-same-key ⇒ 422; TTL cleanup covered.

### [ ] T-012 — Optimistic concurrency guard (ADR-0004)
- **Serves:** MO-7 · **Verifies:** FR-061, BR-014
- Do: `ETag=version` on reads; `If-Match` required on writes; stale ⇒ `409 version_conflict`; version bump is check-and-set.
- **DoD:** concurrency test with two parallel writers → exactly one succeeds, other gets 409 (E-05); no lost update.

### [ ] T-013 — Audit outbox (ADR-0002)
- **Serves:** MO-8 · **Verifies:** FR-062, P3
- Do: write `audit_events` row in the same tx as the state change; hash-chain (`prev_hash`→`hash`); outbox publisher to bus.
- **DoD:** test FF-007 (every state-changing path emits exactly one event); tamper test: modifying a row breaks the chain and is detected; publisher dedups by `event_id`.

---

## Wave 2 — Lifecycle capabilities

### [ ] T-020 — Issuance + vault tokenization
- **Serves:** MO-1 · **Verifies:** FR-001/002/003, BR-004/020
- Do: KYC check; call VaultClient → `network_token`+`last4`; persist card `CREATED`; PAN never stored/logged; idempotent (T-011).
- **DoD:** E-01 (KYC-fail ⇒ 403, no card); happy path returns `last4`, no PAN; PAN-leak grep clean (FF-006); E-11 vault-down ⇒ 503 fail-closed, no partial card.

### [ ] T-021 — Activation
- **Serves:** MO-2 · **Verifies:** FR-010/011
- Do: `CREATED→ACTIVE` via T-010; If-Match; audit.
- **DoD:** activate CREATED ⇒ ACTIVE; activate non-CREATED ⇒ 409 (E-03); one audit event.

### [ ] T-022 — Freeze / unfreeze + freeze_type
- **Serves:** MO-3 · **Verifies:** FR-020/022/023/024, BR-005/013
- Do: user vs compliance `freeze_type`; user cannot lift compliance freeze; unfreeze restores ACTIVE without resetting limit windows.
- **DoD:** user-freeze/unfreeze round-trip; E-04 (user unfreeze of compliance ⇒ 403); window not reset on unfreeze (BR-013 test).

### [ ] T-023 — Fraud-event consumer → compliance freeze
- **Serves:** MO-3 · **Verifies:** FR-025, BR-005
- Do: consume `fraud.suspected`; apply compliance freeze idempotently by `event_id`.
- **DoD:** E-17 (duplicate events ⇒ one freeze, one `card.frozen`).

### [ ] T-024 — Limits: validate on write
- **Serves:** MO-4 · **Verifies:** FR-030/033, BR-006/007/009, D-04
- Do: validate each ≥ 0, `per_transaction ≤ daily ≤ monthly`, currency == card; minor units only; persist + audit.
- **DoD:** E-06 (per_tx>daily ⇒ 422), E-07 (currency mismatch ⇒ 422), E-20 (negative/non-int ⇒ 422); no float in code (FF-008).

### [ ] T-025 — Authorization `evaluate` (hot path)
- **Serves:** MO-4 · **Verifies:** FR-031/032/064, D-01/D-03, NFR-006
- Do: read-only decision from state + limits; calendar window in account tz (D-01); inclusive at `==`, decline at `>` (D-03); fail-closed to decline on ambiguity.
- **DoD:** decline when not ACTIVE (BR-003); boundary tests E-08 (approve at ==, decline at >); window sums correct; E-10 fail-closed; perf smoke asserts p95 < 50 ms locally (full check FF-002).

### [ ] T-026 — Transactions read model
- **Serves:** MO-5 · **Verifies:** FR-040/041/042, BR-011
- Do: newest-first cursor pagination (max 100, default 50); immutable rows; read-after-write freshness.
- **DoD:** ordering + pagination tests; E-13 (empty ⇒ 200 empty page); E-18 (bad cursor ⇒ 400); immutability asserted.

### [ ] T-027 — Closure + SCA step-up
- **Serves:** MO-6 · **Verifies:** FR-050/051/052, BR-012
- Do: require `X-SCA-Token`; `*→CLOSED`; reject all ops on CLOSED; irreversible.
- **DoD:** E-14 (no SCA ⇒ 401); E-15 (any op on CLOSED ⇒ terminal code); close is idempotent; audited.

---

## Wave 3 — Cross-cutting hardening & verification

### [ ] T-030 — AuthZ (deny-by-default, ownership, ops scopes, SoD)
- **Serves:** all · **Verifies:** FR-063, P5, NFR-015
- Do: per-object ownership for users; explicit ops/compliance scopes; ops cannot spend; SCA gate wiring.
- **DoD:** authz matrix test incl. E-16 (User A on User B's card ⇒ 403); 0 cross-tenant access.

### [ ] T-031 — Rate limiting & abuse protection
- **Serves:** DoS mitigation · **Verifies:** T-005, spec §11
- Do: per-user write rate limits; evaluate isolated; opaque ids already from T-002.
- **DoD:** rate-limit test returns 429 past threshold; evaluate path unthrottled.

### [ ] T-032 — Fault injection / fail-closed suite
- **Serves:** reliability · **Verifies:** FR-064, NFR-010
- Do: simulate vault/ledger/fraud down; assert deny/hold + retryable errors, no inconsistent state.
- **DoD:** E-10/E-11 pass; no state left half-applied under injected failure.

### [ ] T-033 — Security gates (SAST/SCA/secret + PAN-leak)
- **Serves:** MO-1/8 · **Verifies:** NFR-004/012, FF-004/006
- Do: bandit, pip-audit, gitleaks, PAN-regex grep over logs/fixtures in CI.
- **DoD:** all gates green; 0 critical/high; PAN grep finds nothing.

### [ ] T-034 — E2E happy path + key edges
- **Serves:** all MOs · **Verifies:** §10
- Do: issue→activate→set-limits→freeze→unfreeze→evaluate→close, plus E-04/E-05/E-14.
- **DoD:** e2e green in CI; fixtures from spec §10 present.

### [ ] T-035 — Load test + SLO wiring (FF-002)
- **Serves:** performance · **Verifies:** NFR-001/006/003, [[observability]]
- Do: load profile; dashboards for evaluate + writes; SLO/error-budget alerts.
- **DoD:** p95 evaluate < 50 ms, lifecycle write < 200 ms under profile; dashboards + alerts live.

### [ ] T-036 — Traceability closure
- **Serves:** governance · **Verifies:** P7
- Do: fill [[traceability-matrix]]; assert no orphan FR/NFR (every one has task + test).
- **DoD:** matrix complete; a CI check fails if any FR/NFR lacks a linked task/test.

---

## Dependency summary

```
Wave 0 (T-001,002,003)
   └─▶ Wave 1 (T-010,011,012,013)
          └─▶ Wave 2 (T-020…027)
                 └─▶ Wave 3 (T-030…036)
```
MVP (P1) = Waves 0–2 minus P2 items (T-023, T-025 §FR-032 part); Wave 3 hardens and verifies.
