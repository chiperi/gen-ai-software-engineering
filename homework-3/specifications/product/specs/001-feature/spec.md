# Product Specification: Virtual Card Lifecycle

**Status:** Draft · **Feature ID:** 001 · **Owner:** Business Analyst
**Depends on:** [[00-constitution]] (principles P1–P8), [[domain-glossary]], [[domain-business-rules]] (BR-xxx)
**Downstream:** [[plan]] (architecture), `contracts/openapi.yaml`, [[nfr]], `delivery/tasks.md`, [[traceability-matrix]]

> WHAT and WHY. This is the layered, executable specification: an engineering team **or** an AI agent
> should be able to build from it without guessing. HOW lives in `architecture/`.

---

## 0. Reading guide (layers)

| Layer | Section | Purpose |
|-------|---------|---------|
| High-level objective | §2 | North star + scope boundary |
| Stakeholders | §3 | Who this serves |
| Mid-level objectives | §4 | Observable "what" (MO-x) |
| Functional requirements | §5 | EARS + Given/When/Then per capability (FR-xxx) |
| Non-functional & policy | §6 | Security, audit, reliability, performance as numbers |
| Implementation notes | §7 | Guardrails an agent must not violate |
| Context | §8 | Beginning / ending state |
| Edge cases & failure modes | §9 | Explicit table + expected behavior |
| Verification | §10 | How we know each MO is met |
| Performance | §11 | Measurable budgets (assumed targets, justified) |
| Low-level tasks | §12 | Executable slices → `delivery/tasks.md` |

---

## 1. Problem & context

Neobank customers need spendable card credentials **instantly and safely** — to transact online, to
cap exposure per merchant or per month, and to shut a card down the moment something looks wrong —
without waiting for physical plastic. Internally, ops/compliance must be able to see and, when
required by regulation or fraud signals, intervene on any card, with a complete audit trail.

Today (hypothetical beginning state, §8) there is a funding-account service and a PCI token vault,
but **no** service that owns the *lifecycle* of a virtual card. This spec defines that service.

---

## 2. High-Level Objective

> **Give end-users self-service control over the full lifecycle of a virtual payment card — issue,
> activate, freeze/unfreeze, set spending limits, and view transactions, through to permanent
> closure — in a way that is auditable, idempotent, and safe for a regulated (PCI-DSS / PSD2-style)
> environment.**

**Scope boundary (one sentence):** this feature owns the card's *lifecycle state, spending limits,
audit trail, and a read model of its transactions* — it does **not** build the authorization
network, the funding/ledger settlement, the PAN/token vault, KYC, or any UI.

---

## 3. Stakeholders & personas

| Persona | Goal | Powers | Explicitly cannot |
|---------|------|--------|-------------------|
| **End-user (cardholder)** | Get a usable card fast; control risk; stop a card instantly | Issue, activate, user-freeze/unfreeze, set own limits, view own transactions, close | Touch another user's card; lift a compliance freeze |
| **Ops / compliance** | Oversight; intervene when regulation/fraud requires; investigate | Read any card; compliance-freeze/unfreeze; review disputes/audit | Perform a user's spend; edit history or audit records |
| **Fraud service** (system) | Contain suspected fraud automatically | Trigger compliance-freeze via event | Unfreeze; change limits |
| **Auditor / regulator** (read-only, offline) | Reconstruct exactly what happened | Read audit trail | Mutate anything |

Trust boundaries and threats for these actors: [[threat-model]].

---

## 4. Mid-Level Objectives (observable)

Each is phrased as *what changes in the world* when it succeeds, and is independently verifiable (§10).

- **MO-1 — Instant issuance.** A KYC-passed user can obtain a new virtual card in `CREATED` state with a network token + `last4`, and never sees or receives a full PAN from us.
- **MO-2 — Explicit, legal lifecycle.** A card moves only through legal transitions (BR-001/002); every transition is atomic and produces exactly one audit event.
- **MO-3 — Instant risk control (freeze).** A user can freeze an active card so that all subsequent authorizations are declined within the freshness budget (§11); a compliance freeze cannot be lifted by the user (BR-005).
- **MO-4 — Enforceable spending limits.** Per-transaction, daily, and monthly limits are validated on write and enforced on every authorization decision (BR-006/009).
- **MO-5 — Truthful transaction visibility.** A user/ops can read an accurate, immutable, newest-first, paginated history of a card's transactions (BR-011).
- **MO-6 — Safe closure.** A card can be permanently closed (BR-002) with step-up auth; closure is irreversible and fully audited.
- **MO-7 — Idempotent, concurrency-safe writes.** Every state-changing call is safe to retry (at-most-once effect) and conflicting concurrent writes never corrupt state (BR-010/014).
- **MO-8 — Complete auditability.** Every state change is reconstructable from an append-only, tamper-evident trail with actor, reason, before→after, and correlation id (P3).

### Success Criteria (measurable, SC-xxx)

How we know the objectives are met, as numbers we can check. Each ties to an MO and to a verification
in §10 / [[nfr]]. Hypothetical figures are *assumed targets* (see §11).

| ID | Success criterion (measurable) | Serves | Verified by |
|----|-------------------------------|--------|-------------|
| **SC-001** | Time-to-usable card (issue → activate) p95 < 3 s end-to-end | MO-1/2 | integration timing |
| **SC-002** | Freeze effectiveness: authorizations decline within ≤ 2 s of freeze commit, 100% of the time | MO-3 | freeze-propagation probe (NFR-009) |
| **SC-003** | Authorization `evaluate` p95 < 50 ms under the load profile | MO-4 | load test (NFR-006 / FF-002) |
| **SC-004** | 0 occurrences of PAN/CVV outside the vault boundary (logs, traces, DB, fixtures) | MO-1 | PAN-leak grep + schema review (NFR-012 / FF-006) |
| **SC-005** | 100% of state changes produce exactly one audit event | MO-8 | audit-completeness test (FF-007) |
| **SC-006** | 0 lost updates across the concurrency test matrix (parallel writers) | MO-7 | concurrency test (FR-061) |
| **SC-007** | 100% of limit-validation and boundary cases (E-06/07/08/20) behave per D-03 | MO-4 | unit + integration (§10) |
| **SC-008** | 99.9% monthly availability of the lifecycle API | all | SLO monitor (NFR-002) |
| **SC-009** | 100% of FR/NFR rows traced to a task and a test (no orphans) | all | traceability check (T-036 / P7) |

---

## 5. Functional Requirements

Notation: **EARS** ("When/While/If … the system shall …") + **Given/When/Then** acceptance.
Priority: **P1 = MVP**, P2 = fast-follow. Each FR cites the MO it serves and the BR it enforces.

### 5.1 Issuance — *User story:* As a KYC-passed user, I want to create a virtual card so I can pay online immediately. *(P1, MO-1)*

- **FR-001 (P1).** When an authenticated user with `KYC = passed` requests a new card with a valid currency and idempotency key, the system shall create a card in `CREATED` state, request a network token from the vault, and return `card_id`, `network_token`, `last4`, `state`, `currency`. *(BR-004, P2)*
  - **Given** a KYC-passed user **When** they POST a card create with a fresh idempotency key **Then** a `CREATED` card is returned with `last4` and no PAN, and one `card.created` audit event exists.
  - **Given** the same idempotency key is replayed **When** POST repeats **Then** the identical card is returned and **no** second card or audit event is created. *(BR-010)*
- **FR-002 (P1).** If the user's `KYC ≠ passed`, then the system shall refuse issuance with `403 kyc_required` and create no card. *(BR-004)*
- **FR-003 (P1).** The system shall never return, log, or persist the full PAN or CVV outside the vault boundary; card identity is `network_token` + `last4` only. *(P2, BR-020)*

### 5.2 Activation — *User story:* As a user, I want to activate my new card so it can authorize spend. *(P1, MO-2)*

- **FR-010 (P1).** When a user activates a card in `CREATED` state, the system shall transition it to `ACTIVE`, atomically, and emit a `card.activated` audit event. *(BR-001)*
  - **Given** a `CREATED` card **When** activate is called **Then** state becomes `ACTIVE` and the card can authorize.
- **FR-011 (P1).** If activation targets a card not in `CREATED` (e.g. already `ACTIVE`, `FROZEN`, `CLOSED`), then the system shall reject with `409 illegal_transition` and a stable machine-readable code, changing nothing. *(BR-001/002)*

### 5.3 Freeze / Unfreeze — *User story:* As a user, I want to freeze my card instantly so a lost/suspicious card stops spending; ops needs the same for compliance. *(P1, MO-3)*

- **FR-020 (P1).** When a user freezes their `ACTIVE` card, the system shall transition it to `FROZEN` with `freeze_type = user` and emit `card.frozen`. *(BR-001)*
- **FR-021 (P1).** While a card is `FROZEN`, the system shall decline **all** authorizations for it. *(BR-003)*
- **FR-022 (P1).** When a user unfreezes a card whose `freeze_type = user`, the system shall return it to `ACTIVE` and emit `card.unfrozen`. *(BR-001, BR-013)*
- **FR-023 (P1).** If a user attempts to unfreeze a card whose `freeze_type = compliance`, then the system shall reject with `403 compliance_freeze_locked` and leave it `FROZEN`. *(BR-005)*
- **FR-024 (P1).** When ops/compliance (or an inbound fraud event) freezes a card, the system shall set `freeze_type = compliance`; only ops/compliance may unfreeze it. *(BR-005)*
- **FR-025 (P2).** When the fraud service publishes a `fraud.suspected` event for a card, the system shall apply a compliance freeze idempotently (same event ⇒ one freeze). *(BR-010)*

### 5.4 Spending limits — *User story:* As a user, I want per-transaction / daily / monthly caps so my exposure is bounded. *(P1, MO-4)*

- **FR-030 (P1).** When a user sets limits (`per_transaction`, `daily`, `monthly`) in the card's currency, the system shall validate them (each ≥ 0; `per_transaction ≤ daily ≤ monthly` where all set; currency matches card) and, if valid, persist them and emit `card.limits_updated`. *(BR-006/007/009)*
  - **Given** `daily = 100.00`, `per_transaction = 150.00` **When** set-limits is called **Then** it is rejected `422 invalid_limits` (per-tx exceeds daily) and nothing changes.
- **FR-031 (P1).** While a card is `ACTIVE`, when an authorization is evaluated, the system shall decline it if it would exceed **any** applicable limit, considering already-authorized spend in the current window. *(BR-006/008)*
- **FR-032 (P2).** When limits are lowered below current-window spend, the system shall block further spend in that window but shall not reverse already-settled transactions. *(BR-008)*
- **FR-033 (P1).** The system shall treat all limit values as minor units with explicit currency and shall never use floating-point math for limit comparison. *(BR-021, P1)*

### 5.5 Transactions view — *User story:* As a user/ops, I want to see a card's transactions to reconcile spend. *(P1, MO-5)*

- **FR-040 (P1).** When a permitted actor requests a card's transactions, the system shall return them newest-first, paginated (cursor-based), each showing amount (minor units + currency), merchant descriptor, status, and UTC timestamp. *(BR-011/022)*
- **FR-041 (P1).** The transaction read model shall be immutable; corrections appear as new reversal/refund entries, never as edits. *(BR-011)*
- **FR-042 (P2).** Reads shall reflect a write within the read-after-write freshness budget (§11); stale reads beyond the budget are a defect.

### 5.6 Closure — *User story:* As a user, I want to permanently close a card I no longer need. *(P1, MO-6)*

- **FR-050 (P1).** When a user closes a card in `CREATED`, `ACTIVE`, or `FROZEN`, after passing step-up auth (SCA), the system shall transition it to `CLOSED` and emit `card.closed`. *(BR-001/012)*
- **FR-051 (P1).** While a card is `CLOSED`, the system shall reject every state-changing operation and every authorization with a stable terminal-state code, and closure shall be irreversible. *(BR-002)*
- **FR-052 (P1).** If closure is attempted without valid step-up auth, then the system shall reject with `401 sca_required` and leave state unchanged. *(BR-012)*

### 5.7 Cross-cutting

- **FR-060 (P1) — Idempotency.** Every state-changing endpoint shall require an `Idempotency-Key`; a replay within the retention window shall return the original result with at-most-once effect. *(BR-010, P4)*
- **FR-061 (P1) — Concurrency.** Concurrent state-changing writes to one card shall be serialized via optimistic concurrency (version / `If-Match` ETag); a stale write shall fail `409 version_conflict` and never last-writer-wins over state. *(BR-014)*
- **FR-062 (P1) — Audit.** Every successful and every rejected state-changing operation shall append one tamper-evident audit event (actor, role, action, before→after, reason, correlation id, UTC). *(P3)*
- **FR-063 (P1) — Authorization.** The system shall deny by default; a user may act only on their own cards; ops/compliance scopes are explicit and cannot include user spend. *(P5)*
- **FR-064 (P1) — Fail closed.** If a required dependency (vault, ledger, fraud) is unavailable or a check is ambiguous, the system shall choose the safe outcome (deny/hold) and surface a non-sensitive error. *(P6)*

---

## 6. Non-Functional & Policy (summary — numbers live in [[nfr]])

- **Security:** PAN/CVV confined to vault boundary; TLS 1.2+ in transit; encryption at rest; secrets never in code/logs; 0 critical/high vulns at release gate. *(P2, [[threat-model]])*
- **Privacy:** data minimization; PII masked in all non-authoritative stores; retention + erasure per policy. *(P8)*
- **Audit & logging:** structured JSON logs, no PII/PAN; append-only audit store; audit retention ≥ regulatory window (assume 7 years). *(P3)*
- **Reliability:** availability target 99.9%/month for the lifecycle API (see [[nfr]] NFR-002); fail-closed on dependency loss. *(P6)*
- **Performance:** latency, freshness, and throughput budgets in §11 / [[nfr]].
- **Compliance posture:** PCI-DSS scope minimization (we stay out of scope by never touching PAN), PSD2-style SCA for sensitive actions, full auditability for regulator reconstruction.

---

## 7. Implementation Notes (guardrails — an agent must not violate these)

1. **Money:** store/compute as integer minor units (or `Decimal`); one currency per card; no float; banker's rounding once at the presentation edge. *(P1, BR-021)*
2. **IDs:** card/transaction/audit ids are opaque, non-sequential (UUIDv7/ULID); never expose sequential counters. *(BR-023)*
3. **Idempotency:** persist idempotency keys with the response hash; scope keys per endpoint + actor; TTL ≥ retry window. *(FR-060)*
4. **Error semantics:** stable machine-readable codes (`illegal_transition`, `invalid_limits`, `compliance_freeze_locked`, `version_conflict`, `sca_required`, `kyc_required`); HTTP status is secondary to the code. Errors never leak PAN, internal ids, or stack traces.
5. **State machine:** one authoritative transition function; reject illegal transitions (BR-001); `CLOSED` is terminal (BR-002).
6. **PAN handling:** request tokenization from the vault; store `network_token` + `last4`; drop CVV after authorization; forbid PAN in logs/traces/metrics/URLs/analytics. *(P2)*
7. **Time:** persist/compare UTC ISO-8601; limit windows computed in a declared timezone/policy, documented, not implicit local time. *(BR-022)*
8. **Concurrency:** optimistic version per card; all writes check-and-set; retries respect idempotency. *(FR-061)*
9. **Audit:** write the audit event in the same transaction as the state change (or via an outbox) so a state change without an audit record is impossible. *(P3)*
10. **Authorization decisions** are read-only to this service: we expose an *evaluate* function (state + limits) that the auth network calls; we do not move money.

---

## 8. Context

### Beginning context (exists before work starts — hypothetical)
- **Funding-account service** — owns accounts/balances; referenced by `funding_account_id`. (external)
- **PCI token vault** — issues network tokens from PANs; the only holder of full PAN/CVV. (external)
- **KYC service** — exposes cardholder verification status. (external)
- **Fraud service** — publishes `fraud.suspected` events. (external)
- **Identity/authN** — issues authenticated sessions + SCA step-up. (external)
- No virtual-card lifecycle service, schema, contract, or audit store yet.
- Spec bundle `specifications/` exists (this document and its dependencies).

### Ending context (exists after work is done)
- A **card-lifecycle service** implementing FR-001…FR-064 behind `contracts/openapi.yaml` (+ `asyncapi.yaml` for `card.*` / `fraud.suspected` events).
- Datastores: `cards` (state, limits, version, `network_token`, `last4`, currency), `card_transactions` (immutable read model), `audit_events` (append-only), `idempotency_keys`.
- Test suites (unit / integration / contract / e2e — as documentation, §10) and fixtures.
- Green quality gates + fitness functions ([[fitness-functions]]); populated [[traceability-matrix]].
- No PAN/CVV anywhere outside the vault boundary.

---

## 9. Edge cases & failure modes (scoped to this feature)

Expected behavior = user-visible outcome **+** audit/compliance implication.

| # | Situation | Expected behavior | Code / audit |
|---|-----------|-------------------|--------------|
| E-01 | Issue for user with `KYC ≠ passed` | Refuse; no card created | `403 kyc_required`; audit `issue_denied` |
| E-02 | Replay of create with same idempotency key | Return original card; no duplicate | one audit event only (FR-060) |
| E-03 | Activate an already-`ACTIVE`/`CLOSED` card | Reject; no change | `409 illegal_transition` |
| E-04 | User tries to unfreeze a **compliance** freeze | Reject; stays `FROZEN` | `403 compliance_freeze_locked`; audit attempt |
| E-05 | Concurrent freeze + set-limits on same card | Serialize; stale one fails | `409 version_conflict` (FR-061) |
| E-06 | Set `per_transaction > daily` | Reject all; nothing persisted | `422 invalid_limits` |
| E-07 | Limit currency ≠ card currency | Reject | `422 invalid_limits` (BR-007) |
| E-08 | Auth exactly at limit boundary | Approve at ==, decline at `>` (documented inclusivity) | audit decision |
| E-09 | Lower limit below current-window spend | Block further spend; do **not** reverse settled | audit `limits_updated` (FR-032) |
| E-10 | Auth arrives while freeze is in flight | Fail closed: decline if freeze committed or ambiguous | audit `auth_declined` (P6) |
| E-11 | Token vault unavailable during issue | Fail closed: no card in inconsistent state; retryable error | `503`; audit `issue_failed` |
| E-12 | Transactions read for a just-written txn | Reflect within freshness budget; else defect | §11 / FR-042 |
| E-13 | Empty transaction history | Return empty page, not error | 200 empty page |
| E-14 | Close without SCA step-up | Reject; unchanged | `401 sca_required` (FR-052) |
| E-15 | Any op on a `CLOSED` card | Reject; terminal | stable terminal code (FR-051) |
| E-16 | User A acts on User B's card | Deny by default | `403 forbidden`; audit `authz_denied` (FR-063) |
| E-17 | Duplicate `fraud.suspected` events | Idempotent single freeze | one `card.frozen` (FR-025) |
| E-18 | Pagination cursor tampered/expired | Reject cursor; no data leak | `400 invalid_cursor` |
| E-19 | Clock skew across services | UTC everywhere; window math uses server authority | (BR-022) |
| E-20 | Negative or non-integer limit amount | Reject | `422 invalid_limits` (BR-009/021) |

---

## 10. Verification — how we know each MO is met

| MO | Verification |
|----|--------------|
| MO-1 | Integration test: KYC-passed issue returns `last4`, no PAN; grep test asserts PAN never appears in logs/response fixtures. Manual PCI checklist review. |
| MO-2 | State-machine unit tests cover every legal + every illegal transition (BR-001/002); property test: after any op the state is one of the 4 legal states and an audit event exists. |
| MO-3 | Integration: freeze ⇒ subsequent evaluate = decline within freshness budget; compliance-freeze cannot be user-unfrozen (E-04). |
| MO-4 | Unit + integration on limit validation (E-06/07/20) and enforcement at boundary (E-08); reconciliation check: sum(authorized) ≤ limits per window. |
| MO-5 | Contract + integration: ordering (newest-first), pagination, immutability (E-13/18); read-after-write freshness (E-12). |
| MO-6 | Integration: close requires SCA (E-14); post-close every op rejected (E-15); irreversibility asserted. |
| MO-7 | Idempotency tests (E-02/17); concurrency tests with parallel writers assert no lost update (E-05, FR-061). |
| MO-8 | Audit tests: every FR path (success and rejection) yields exactly one tamper-evident event with required fields; audit store append-only (attempted mutation fails). Traceability matrix has no orphan requirement. |

**Test categories (as documentation):** unit (state machine, money, validation) · integration (endpoints + datastore) · contract (OpenAPI/AsyncAPI conformance, [[fitness-functions]] FF) · e2e (issue→activate→limit→freeze→close happy path + key edge cases) · security (SAST/SCA/secret-scan gate) · compliance review (PAN-leak grep, audit completeness).
**Fixtures:** a KYC-passed and a KYC-failed user; a card in each state; a limit set at a boundary; a `fraud.suspected` event; a tampered pagination cursor.

---

## 11. Expected performance (assumed targets — justified)

All numbers are **assumed targets** for a FinTech UX/ops context; rationale given so they can be
challenged. Authoritative table + how-verified: [[nfr]].

| Metric | Target | Why reasonable |
|--------|--------|----------------|
| Lifecycle write (freeze/limit/activate) latency | **p95 < 200 ms, p99 < 500 ms** server-side | Freeze must feel instant when a user thinks a card is compromised; 200 ms p95 is a standard interactive-API budget. |
| Authorization evaluate (state+limit check) latency | **p95 < 50 ms, p99 < 120 ms** | Sits in the synchronous card-network auth path; the network budget is tight (~hundreds of ms total), so our slice must be small. |
| Transactions read latency | **p95 < 300 ms** for a 50-item page | List views tolerate slightly more than a single-write action. |
| Read-after-write freshness (state/limits) | **< 1 s** for the acting user | A user must see their own freeze reflected almost immediately; strong-ish consistency for own writes. |
| Freeze effectiveness | **≤ 2 s** from freeze commit to auth-path decline | Fraud containment window; bounded propagation to the evaluate path. |
| Throughput | **≥ 1000 rps** evaluate, **≥ 200 rps** lifecycle writes per region | Sizing for a mid-size neobank peak; horizontally scalable (NFR-005). |
| Pagination | cursor-based, **max page 100**, default 50 | Prevents unbounded scans; stable ordering under concurrent writes. |
| Rate limits | per-user **≥ 20 writes/min**, evaluate unthrottled internally | Abuse/enumeration protection without blocking legitimate control. |
| Availability | **99.9%/month** lifecycle API | ~43 min/month error budget; standard for non-tier-0 financial control plane. |

---

## 12. Low-Level Tasks (executable slices → `delivery/tasks.md`)

Real decomposition lives in `delivery/tasks.md` (waves, dependencies, acceptance criteria per task);
this is the map from task-group to MO. Each task there ends with a **Definition of Done** an
implementer can check off, and appears in [[traceability-matrix]].

| Task group | Serves | Sketch |
|------------|--------|--------|
| Data model & migrations (`cards`, `card_transactions`, `audit_events`, `idempotency_keys`) | MO-2/5/7/8 | schema, opaque ids, version column, constraints |
| State machine + transition function | MO-2/6 | legal transitions (BR-001/002), one entry point, illegal→error |
| Issuance + vault tokenization | MO-1 | KYC check, tokenize, `network_token`+`last4`, PAN never persisted |
| Freeze/unfreeze + freeze_type | MO-3 | user vs compliance (BR-005), fraud event handler |
| Limits: validate + enforce | MO-4 | validation (BR-006/009), evaluate function, window math (BR-008) |
| Transactions read model | MO-5 | immutable, newest-first, cursor pagination |
| Closure + SCA | MO-6 | step-up gate, terminal state |
| Idempotency middleware | MO-7 | key store, replay = original result |
| Optimistic concurrency | MO-7 | version/ETag, `version_conflict` |
| Audit outbox | MO-8 | one event per change, append-only, tamper-evident |
| AuthZ (deny-by-default, roles) | all | ownership + ops scopes (P5) |
| Contracts (OpenAPI/AsyncAPI) + conformance | all | FF contract tests |
| Test suites + fixtures | all (§10) | unit/integration/contract/e2e/security |

---

## 13. Resolved decisions (previously open)

Confirmed by product (these were the open clarification questions). Now binding for `architecture/`
and `delivery/`.

| # | Decision | Resolution |
|---|----------|-----------|
| D-01 | Daily/monthly limit window | **Calendar** day/month evaluated in the account's timezone (not rolling 24 h). Window boundaries are documented, UTC-persisted (BR-022). |
| D-02 | Audit retention | **7 years**, append-only; never deleted by application code (P3). |
| D-03 | Limit-boundary inclusivity | **Approve at `amount == limit`, decline at `amount > limit`** (E-08). Applies to per-transaction, and to cumulative window checks for daily/monthly. |
| D-04 | Multi-currency | **One currency per card**; no cross-currency card. A different-currency need ⇒ a separate card. |
