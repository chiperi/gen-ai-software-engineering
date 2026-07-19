# Traceability Matrix

Requirement → design/ADR → task → test. Nothing gets "lost" (constitution P7). A CI check
(T-036 / FF) fails if any FR or NFR row lacks a linked task **and** test.

Legend: ✅ specified & traced (implementation pending — this is a spec bundle, not code).

## Functional requirements

| Requirement | Serves | Design / ADR | Task | Test / verification | Status |
|-------------|--------|--------------|------|---------------------|--------|
| FR-001 issue | MO-1 | plan §2, ADR-0005 | T-020 | int: issue returns last4/no PAN | ✅ |
| FR-002 KYC gate | MO-1 | plan §2 | T-020 | E-01 kyc_required | ✅ |
| FR-003 no PAN | MO-1 | ADR-0005, threat T-004 | T-020, T-033 | FF-006 PAN-leak grep | ✅ |
| FR-010/011 activate | MO-2 | plan §4, BR-001 | T-021 (T-010) | unit transitions, E-03 | ✅ |
| FR-020 user freeze | MO-3 | BR-001 | T-022 | round-trip test | ✅ |
| FR-021 frozen declines | MO-3 | BR-003 | T-025 | evaluate decline when FROZEN | ✅ |
| FR-022 unfreeze | MO-3 | BR-001/013 | T-022 | window-not-reset test | ✅ |
| FR-023 compliance lock | MO-3 | BR-005 | T-022 | E-04 compliance_freeze_locked | ✅ |
| FR-024 ops/compliance freeze | MO-3 | BR-005 | T-022 | role test | ✅ |
| FR-025 fraud event freeze | MO-3 | ADR-0002 | T-023 | E-17 idempotent single freeze | ✅ |
| FR-030 set limits | MO-4 | ADR-0005, BR-006/009 | T-024 | E-06/07/20 invalid_limits | ✅ |
| FR-031 enforce limits | MO-4 | plan §4, D-01/D-03 | T-025 | E-08 boundary, window sums | ✅ |
| FR-032 lower-limit semantics | MO-4 | BR-008 | T-025 | E-09 no reversal | ✅ |
| FR-033 minor units | MO-4 | ADR-0005 | T-024 | FF-008 no-float | ✅ |
| FR-040/041 tx read | MO-5 | plan §3, BR-011 | T-026 | ordering/pagination, E-13/18 | ✅ |
| FR-042 freshness | MO-5 | plan §6 | T-026 | read-after-write probe (NFR-008) | ✅ |
| FR-050/051 close | MO-6 | BR-001/002 | T-027 | E-15 terminal | ✅ |
| FR-052 SCA on close | MO-6 | BR-012 | T-027 | E-14 sca_required | ✅ |
| FR-060 idempotency | MO-7 | ADR-0003 | T-011 | E-02 replay = original | ✅ |
| FR-061 concurrency | MO-7 | ADR-0004 | T-012 | E-05 version_conflict | ✅ |
| FR-062 audit | MO-8 | ADR-0002 | T-013 | FF-007 audit completeness | ✅ |
| FR-063 authZ | all | plan §6, threat T-001/006 | T-030 | E-16 cross-tenant deny | ✅ |
| FR-064 fail closed | all | plan §6 | T-025, T-032 | E-10/11 fault injection | ✅ |

## Non-functional requirements

| NFR | Design | Task | Verification | Status |
|-----|--------|------|--------------|--------|
| NFR-001 write p95<200ms | plan §1 | T-035 | FF-002 load test | ✅ |
| NFR-006 evaluate p95<50ms | ADR-0001 | T-025, T-035 | FF-002 | ✅ |
| NFR-002 availability 99.9% | observability | T-035 | SLO monitor | ✅ |
| NFR-004 0 crit/high vulns | fitness-functions | T-033 | FF-004 | ✅ |
| NFR-011 audit durability | ADR-0002 | T-013 | outbox + backup test | ✅ |
| NFR-012 PAN exposure 0 | threat T-004 | T-020, T-033 | FF-006 | ✅ |
| NFR-014 audit retention 7y | ADR-0002 | T-002 | DB grant review | ✅ |
| NFR-015 authZ correctness | threat T-001 | T-030 | authz matrix (E-16) | ✅ |
| NFR-016 coverage ≥85% | plan §5 | T-010…034 | coverage gate | ✅ |
| NFR-017 module boundaries | ADR-0001 | T-001 | FF-001/003 arch test | ✅ |
| NFR-018 contract conformance | contracts/ | T-003 | FF-005 schemathesis | ✅ |
| NFR-019 structured obs. | observability | T-001 | log audit | ✅ |

## Threats → mitigation (from [[threat-model]])

| Threat | Mitigating task |
|--------|-----------------|
| T-001 spoofing / T-006 EoP | T-030 (authz, SoD, SCA) |
| T-002 tampering | T-011 (idempotency), T-012 (concurrency) |
| T-003 repudiation / T-007 audit integrity | T-013 (append-only hash-chained audit) |
| T-004 disclosure / T-008 enum | T-020/T-033 (no PAN, grep), T-002 (opaque ids) |
| T-005 DoS | T-031 (rate limits) |
| T-009 replay | T-023 (idempotent consumer) |
