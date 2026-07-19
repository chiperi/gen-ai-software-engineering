# Observability & SLO

Supports [[nfr]] (NFR-002/019) and [[00-constitution]] P3/P6. Golden rule: **rich signal, zero PII/PAN**.

## Metrics
- **RED** per endpoint: **R**ate (rps), **E**rrors (by stable error code), **D**uration (p50/p95/p99).
  Dedicated dashboards for `evaluate` (NFR-006) and lifecycle writes (NFR-001).
- **USE** for resources: utilization/saturation/errors of DB pool, outbox lag, bus consumer lag.
- Business counters: freezes/min (user vs compliance), issuances, closures, `version_conflict` rate,
  idempotency-replay rate, fail-closed denials.

## Logs
- Structured **JSON**; one event per request with `correlation_id`, actor, action, result code, latency.
- **Never** log PAN/CVV/full PII (NFR-012/019); `last4` only where needed. A log-field allowlist +
  PAN-regex scrubber in CI (PAN-leak grep) enforce this.
- Audit trail is **separate** from operational logs (append-only store, [[adr-0002]]).

## Traces
- Distributed tracing with a `trace_id` propagated from the client through externals (vault/KYC/fraud).
- Span the hot `evaluate` path to attribute latency against NFR-006.

## SLO / SLA / error budget

| SLI | Target (SLO) | Window | Error budget |
|-----|--------------|--------|--------------|
| Availability (lifecycle API) | 99.9% | 30 days | ~43 min/month |
| Lifecycle write latency p95 | < 200 ms | 30 days | NFR-001 |
| Evaluate latency p95 | < 50 ms | 30 days | NFR-006 |
| Freeze effectiveness | ≤ 2 s | 30 days | NFR-009 |
| Audit completeness | 100% state changes audited | continuous | 0 tolerance (P3) |

## Alerts & runbooks
- Page on: availability burn-rate, evaluate p99 breach, outbox lag > threshold (audit/event delay),
  fail-closed denial spike (dependency down), `version_conflict` spike (hot-card contention),
  any detected audit-hash-chain break (integrity incident).
- Each failure mode in spec §9 links to a runbook entry (E-10/E-11 → dependency-down runbook, etc.).
