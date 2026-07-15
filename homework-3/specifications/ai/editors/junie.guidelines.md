# Junie guidelines (JetBrains) — Virtual Card Lifecycle

Source of truth: `specifications/ai/AGENTS.md`. These guidelines steer Junie for a regulated FinTech
Python service (FastAPI · Postgres).

## Do
- Keep full PAN/CVV out of everything we own — only `network_token` + `last4`.
- Use integer minor units / `Decimal` for money; one currency per card; compare in minor units.
- Route state changes through the single state-machine function; only legal transitions (BR-001/002).
- Make writes idempotent (`Idempotency-Key`) and optimistically concurrent (`If-Match`/ETag).
- Write one audit event per state change in the same DB transaction (outbox).
- Deny by default; enforce separation of duties; SCA + role for sensitive actions.
- Fail closed on ambiguity/dependency loss; return stable error codes.
- Type-hint (`mypy --strict`), validate with Pydantic at boundaries, UTC timestamps, opaque ids.
- Add tests mapped to the FR / edge case; keep coverage ≥ 85% (≥ 90% on state machine + limits).

## Don't
- Log/store/return PAN or CVV, or put PII/ids in URLs.
- Use floats for money or mix currencies on a card.
- Bypass idempotency/concurrency/audit/state-machine paths, or mutate `audit_events`.
- Change scope, contracts, or requirements silently (needs an ADR).
