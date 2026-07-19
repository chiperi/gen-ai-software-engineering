# Non-Functional Requirements (in numbers)

> Every NFR is measurable and testable. Not "fast" — "p95 < 200 ms". Targets are **assumed** for a
> mid-size neobank and justified in `product/specs/001-feature/spec.md` §11. Each maps to a check.

## Performance & scalability

| ID | Attribute | Target (measurable) | How verified |
|----|-----------|---------------------|--------------|
| NFR-001 | Lifecycle write latency | p95 < 200 ms, p99 < 500 ms | load test / FF-002 |
| NFR-006 | Auth `evaluate` latency (hot path) | p95 < 50 ms, p99 < 120 ms | load test / FF-002 |
| NFR-007 | Transactions read latency | p95 < 300 ms (page ≤ 50) | load test |
| NFR-008 | Read-after-write freshness (own writes) | < 1 s | integration probe |
| NFR-009 | Freeze effectiveness (commit → auth decline) | ≤ 2 s | integration probe |
| NFR-003 | Throughput | ≥ 1000 rps evaluate; ≥ 200 rps writes / region | load test |
| NFR-005 | Scalability | horizontal to N stateless instances (state in Postgres) | load test |

## Reliability & availability

| ID | Attribute | Target | How verified |
|----|-----------|--------|--------------|
| NFR-002 | Availability (lifecycle API) | 99.9% / month (~43 min budget) | SLO monitor ([[observability]]) |
| NFR-010 | Fail-closed on dependency loss | 100% of ambiguous checks deny/hold | fault-injection test (P6) |
| NFR-011 | Durability of audit trail | 0 lost audit events; RPO = 0 for committed writes | outbox + backup test ([[adr-0002]]) |

## Security & compliance

| ID | Attribute | Target | How verified |
|----|-----------|--------|--------------|
| NFR-004 | Vulnerabilities at release | 0 critical / 0 high | SAST + SCA gate (FF-004) |
| NFR-012 | PAN/CVV exposure | 0 occurrences outside vault boundary | PAN-leak grep over logs/fixtures; DB schema has no PAN column |
| NFR-013 | Encryption | TLS 1.2+ in transit; AES-256 at rest | config test / review |
| NFR-014 | Audit retention | ≥ 7 years, append-only | DB grant review (no UPDATE/DELETE for app role) |
| NFR-015 | AuthZ correctness | 0 cross-tenant access in test matrix | authz integration matrix (E-16) |

## Maintainability & operability

| ID | Attribute | Target | How verified |
|----|-----------|--------|--------------|
| NFR-016 | Test coverage | ≥ 85% lines; ≥ 90% StateMachine + LimitEngine | coverage gate |
| NFR-017 | Module boundaries | 0 forbidden cross-module imports | FF-001/003 (arch test) |
| NFR-018 | Contract conformance | 100% requests/responses match OpenAPI | schemathesis / FF |
| NFR-019 | Structured observability | 100% requests carry correlation/trace id; logs JSON, no PII | log audit ([[observability]]) |
