# Domain Business Rules — Virtual Card Lifecycle

Rules that are true regardless of implementation. Terms are defined in [[domain-glossary]];
principles they serve are in [[00-constitution]]. Requirements in
`product/specs/001-feature/spec.md` cite these rules by id (`BR-xxx`).

## Lifecycle state machine

States: `CREATED → ACTIVE → FROZEN → ACTIVE → CLOSED` (with the legal transitions below).
`CLOSED` is terminal.

```
                 activate                 freeze
   [CREATED] ───────────────▶ [ACTIVE] ───────────────▶ [FROZEN]
       │                        │  ▲                        │
       │ close                  │  └────── unfreeze ─────────┘
       │ (before activation)    │ close                       │ close
       ▼                        ▼                             ▼
   [CLOSED] ◀───────────────────┴─────────────────────────────┘
```

| ID | Rule |
|----|------|
| **BR-001** | Legal transitions only: `CREATED→ACTIVE`, `CREATED→CLOSED`, `ACTIVE→FROZEN`, `ACTIVE→CLOSED`, `FROZEN→ACTIVE`, `FROZEN→CLOSED`. Any other transition is rejected with a stable error, unaudited-state is never entered. |
| **BR-002** | `CLOSED` is terminal and irreversible. No transition leaves `CLOSED`. A closed card cannot be reactivated; a replacement is a new card. |
| **BR-003** | Only an `ACTIVE` card can authorize spend. `CREATED`, `FROZEN`, `CLOSED` decline all authorizations. |
| **BR-004** | Issuance (`CREATED`) requires a cardholder with `KYC = passed`. Without it, issuance is refused. |
| **BR-005** | A **compliance freeze** (by ops/compliance or fraud) can only be lifted by ops/compliance — the end-user cannot self-unfreeze it. A **user freeze** can be lifted by the user. |
| **BR-006** | Spending limits are `per_transaction`, `daily` (rolling/calendar per config), and `monthly`. An authorization is declined if it would exceed **any** applicable limit. |
| **BR-007** | Limits and amounts are in **minor units** with an explicit currency equal to the card's currency. A limit with a mismatched currency is invalid. |
| **BR-008** | A new `daily`/`monthly` limit takes effect going forward; it never retroactively invalidates already-authorized transactions. Lowering a limit below current-window spend blocks further spend in that window but does not reverse settled spend. |
| **BR-009** | Limit values must be ≥ 0 and within product bounds (`per_transaction ≤ daily ≤ monthly` where all three are set). Violations are rejected as validation errors. |
| **BR-010** | Every lifecycle action and limit change is idempotent by idempotency key and produces exactly one audit event (see [[00-constitution]] Principles 3–4). |
| **BR-011** | Transaction history is read-only to this feature and returned newest-first, paginated. It is immutable — corrections are new events (refund/reversal), never edits. |
| **BR-012** | Sensitive/irreversible actions — permanent `close`, and lifting a compliance freeze — require SCA/step-up and the appropriate role (see [[00-constitution]] Principle 5). |
| **BR-013** | A frozen card continues to accrue no new spend but retains its limits and history; unfreezing restores the prior `ACTIVE` behavior without resetting limit windows. |
| **BR-014** | Concurrent conflicting actions on the same card (e.g. freeze vs. limit change) are serialized; last-writer-wins is **not** acceptable for state — optimistic concurrency (version/ETag) is required (see [[domain-glossary]], edge cases in spec). |

## Data handling rules

| ID | Rule |
|----|------|
| **BR-020** | Full PAN/CVV/track data are confined to the PCI/token-vault boundary; our services hold only `network_token` + `last4` (see [[00-constitution]] Principle 2, [[threat-model]]). |
| **BR-021** | Money is never a float. Display formatting happens at the presentation edge only; internal math is minor-units/`Decimal`. |
| **BR-022** | Timestamps are stored and compared in UTC (ISO-8601); local time is a presentation concern only. |
| **BR-023** | Card and transaction identifiers are opaque, non-sequential (e.g. UUIDv7/ULID) so ids do not leak volume or ordering. |
