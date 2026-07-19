# Threat Model (STRIDE)

**Scope:** the card-lifecycle service and its trust boundaries. Assets and rules from
[[00-constitution]] (P2, P5) and [[domain-business-rules]] (BR-020…023).

## Scope & trust boundaries

```
[ end-user app ] --TLS--> ┌───────── trust boundary: our service ─────────┐
[ ops console  ] --TLS--> │  API (authN/authZ) → app services → Postgres  │
[ card network ] --TLS--> │                                               │
└─ untrusted ─┘           │   outbox → bus → [ fraud consumer ]           │
                          └───────────────────┬───────────────────────────┘
                                 mTLS / signed │
                    [ token vault ] [ KYC ] [ funding ] [ identity ]  (external, trusted-but-verified)
```

Boundaries: client↔API (untrusted input), API↔external services (mTLS, verify), app↔DB (least-priv
role), bus (signed events). Full PAN/CVV live **only** inside the token vault, outside our boundary.

## Assets
- **Funds control** — the ability to spend / stop spend (highest value).
- **Card data** — `network_token`, `last4` (ours); PAN/CVV (vault only, never ours).
- **PII** — cardholder/owner identifiers.
- **Audit trail** — regulatory evidence; integrity is an asset.
- **Secrets** — vault/DB/bus credentials, signing keys.

## Threats (STRIDE)

| ID | Category | Threat | Mitigation | Status |
|----|----------|--------|------------|--------|
| T-001 | Spoofing | Caller impersonates another user to act on their card | Authenticated sessions; deny-by-default + ownership check (FR-063); mTLS to externals | mitigated |
| T-002 | Tampering | Alter limits or state via forged/replayed request | Input validation; `If-Match` optimistic concurrency (FR-061); idempotency key body-hash (ADR-0003) | mitigated |
| T-003 | Repudiation | Actor denies performing a freeze/close | Append-only, hash-chained audit with actor+role (ADR-0002, FR-062) | mitigated |
| T-004 | Information disclosure | PAN/CVV or PII leaks via logs, traces, errors, URLs | PAN never stored (BR-020); JSON logs w/o PII; errors carry no sensitive detail; PAN-leak grep gate (NFR-012) | mitigated |
| T-005 | Denial of Service | Flood of writes / enumeration of card ids | Per-user rate limits (spec §11); opaque non-sequential ids (BR-023); autoscale; evaluate isolated | mitigated |
| T-006 | Elevation of privilege | User lifts a compliance freeze; ops spends as a user | Distinct `freeze_type` + role gate (BR-005, FR-023); SoD — ops cannot spend (P5); SCA on sensitive actions (FR-050/052) | mitigated |
| T-007 | Tampering (integrity) | Someone edits audit rows to hide activity | App DB role has no UPDATE/DELETE on `audit_events`; hash chain detects breaks (NFR-011/014) | mitigated |
| T-008 | Info disclosure (enum) | Guessing card ids to read others' data | UUIDv7/ULID ids (BR-023) + per-object authz (FR-063) | mitigated |
| T-009 | Tampering (replay) | Duplicate `fraud.suspected` causes double action | Idempotent consumer by `event_id` (FR-025) | mitigated |

## Data classification

| Data | Class | Storage | Handling |
|------|-------|---------|----------|
| PAN, CVV, track | **Restricted (PCI)** | vault only — never ours | out of our scope by construction (P2) |
| network_token, last4 | Confidential | our DB (encrypted at rest) | safe to reference; last4 displayable |
| PII (owner id, KYC status) | Confidential | our DB, masked in logs | minimize; retention + erasure per policy (P8) |
| Amounts / limits | Confidential | minor units | no float (ADR-0005) |
| Audit events | Confidential, integrity-critical | append-only, 7-yr retention | tamper-evident (ADR-0002) |

**GDPR/erasure:** owner PII supports right-to-erasure where lawful; audit records are retained under
the legal-obligation basis and are pseudonymized rather than deleted.
