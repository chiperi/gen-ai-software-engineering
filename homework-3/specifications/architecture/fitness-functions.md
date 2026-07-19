# Architecture Fitness Functions

Executable checks of architectural characteristics in CI (Neal Ford). Governance = code in the
pipeline, not manual review. Each maps to an NFR / principle.

| ID | Characteristic | Check | Type | Where | Maps to |
|----|----------------|-------|------|-------|---------|
| FF-001 | Modularity | API layer never imports DB/adapter internals directly; StateMachine has no web deps | atomic / triggered | CI (import-linter) | NFR-017, ADR-0001 |
| FF-002 | Performance | `evaluate` p95 < 50 ms and lifecycle write p95 < 200 ms under load profile | holistic / continual | load test in pipeline | NFR-001/006 |
| FF-003 | Dependencies | no forbidden or cyclic module deps | atomic | CI (import-linter) | NFR-017 |
| FF-004 | Security | 0 critical/high vulns in deps; SAST clean; no secrets | atomic | CI (pip-audit, bandit, gitleaks) | NFR-004 |
| FF-005 | Contract conformance | live responses conform to `contracts/openapi.yaml`; events to `asyncapi.yaml` | atomic | CI (schemathesis, spectral) | NFR-018 |
| FF-006 | No-PAN invariant | grep of logs/fixtures/schema finds no PAN/CVV pattern; DB has no PAN column | atomic | CI (regex gate) | NFR-012, P2 |
| FF-007 | Audit completeness | test asserts every state-changing path emits exactly one audit event | atomic | CI (integration) | P3, FR-062 |
| FF-008 | Money integrity | static check: no `float` in money/limit code paths; amounts are int/Decimal | atomic | CI (ruff rule / custom lint) | ADR-0005, P1 |
