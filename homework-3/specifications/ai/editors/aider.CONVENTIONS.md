# CONVENTIONS.md — Virtual Card Lifecycle

> For Aider (and as a general conventions reference). Source of truth: `specifications/ai/AGENTS.md`.

## Language & tooling
- Python 3.12+, FastAPI + Pydantic v2, PostgreSQL. Lint/format `ruff`; types `mypy --strict`; tests `pytest`.
- Contracts: OpenAPI 3.1 / AsyncAPI 3.0 in `contracts/`. Conformance via schemathesis + spectral.

## Domain conventions (regulated FinTech — do not violate)
- **Money:** integer minor units or `Decimal`; explicit ISO-4217; one currency per card; no `float`; format only at the edge.
- **Card data:** `network_token` + `last4` only; PAN/CVV never in code, logs, traces, tests, URLs.
- **State:** single state-machine function; legal transitions only (BR-001/002); `CLOSED` is terminal.
- **Idempotency & concurrency:** `Idempotency-Key` on writes; `If-Match`/ETag optimistic concurrency.
- **Audit:** one append-only, hash-chained event per state change, in the same transaction (outbox).
- **AuthZ:** deny by default; separation of duties; SCA + role for close / lifting compliance freeze.
- **Reliability:** fail closed on ambiguity/dependency loss; stable error codes; no sensitive detail in errors.

## Patterns
- Pure domain functions (state machine, limit checks); side effects at adapters/edges.
- IDs opaque (UUIDv7/ULID); timestamps UTC ISO-8601.
- Stable error-code enum (see `contracts/openapi.yaml` → `Error`), not ad-hoc strings.
- Conventional Commits with task id, e.g. `feat: add optimistic concurrency guard (T-012)`; one task per PR.
- Every nontrivial change ships a test mapped to its FR / edge case (E-xx).
