# ADR-0001: Modular monolith for the card-lifecycle service

**Status:** accepted
**Date:** 2026-07-16
**Deciders:** Solution Architect · **Relates to:** [[plan]] §1, [[00-constitution]] P7

## Context
The feature is a single bounded context (card lifecycle + limits + audit + transaction read model).
A microservices-per-capability split was on the table. The team is small; the dominant NFRs are a
tight `evaluate` latency budget (p95 < 50 ms, [[nfr]] NFR-006) and strong auditability.

## Decision
Build one **modular monolith** service with clear internal modules (StateMachine, LimitEngine,
Idempotency, Concurrency, AuditOutbox, adapters). Keep module boundaries enforced by a fitness
function ([[fitness-functions]] FF-001/003) so a later extraction is cheap.

## Consequences
- (+) No cross-service network hop on the hot auth path → easier to hit NFR-006.
- (+) Atomic state-change + audit in one transaction (supports [[adr-0002]]).
- (+) Simpler ops, one deploy, one datastore for consistency.
- (−) Must guard against a "big ball of mud" — mitigated by architecture tests (FF-001/003).
- (−) Independent scaling per capability is coarser; acceptable at current throughput ([[nfr]]).
