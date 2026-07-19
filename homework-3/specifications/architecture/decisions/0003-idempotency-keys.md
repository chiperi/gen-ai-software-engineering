# ADR-0003: Idempotency keys for all state-changing writes

**Status:** accepted
**Date:** 2026-07-16
**Deciders:** Solution Architect · **Relates to:** [[00-constitution]] P4, spec FR-060, BR-010

## Context
In payments, clients retry on timeouts. Without idempotency, a retried "create card" or "freeze"
could double-execute (two cards, duplicate audit events). Constitution P4 mandates at-most-once
effect on retry.

## Decision
Every state-changing endpoint requires a client-supplied `Idempotency-Key` header. The server stores
`(key, endpoint, actor_id) → request_hash + response_snapshot` with a TTL ≥ the client retry window
(assume 24 h). A replay with a matching key returns the stored response and performs **no** new
effect. A replay whose `request_hash` differs from the stored one is rejected `422
idempotency_key_reuse` (same key, different body).

## Consequences
- (+) Safe client retries; no duplicate cards/events (E-02, E-17).
- (+) Uniform mechanism across all writes.
- (−) Storage + TTL cleanup for keys; unique index on (key, endpoint, actor).
- (−) Clients must generate keys; documented in `contracts/openapi.yaml` and `ai/AGENTS.md`.
