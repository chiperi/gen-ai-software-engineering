# ADR-0004: Optimistic concurrency via version / ETag

**Status:** accepted
**Date:** 2026-07-16
**Deciders:** Solution Architect · **Relates to:** spec FR-061, BR-014, [[00-constitution]] P4

## Context
Two actors can act on one card concurrently (e.g. user sets a limit while ops applies a compliance
freeze). Last-writer-wins would silently drop a state change — unacceptable for a control plane
(BR-014).

## Decision
Each card row carries a monotonically increasing `version`. Reads return it as an `ETag`. Every
state-changing write must send `If-Match: <version>`; the write is a check-and-set that bumps
`version`. A stale `If-Match` fails `409 version_conflict`, and the client re-reads and retries.
Pessimistic locking is rejected (holds DB locks across the request, worse tail latency).

## Consequences
- (+) No lost updates; conflicts are explicit and auditable (E-05).
- (+) No long-held locks → better p99 under contention.
- (−) Clients must handle `409` with a re-read/retry loop (documented in contracts + AGENTS).
- (−) Requires discipline: every write path goes through ConcurrencyGuard (enforced by review + FF).
