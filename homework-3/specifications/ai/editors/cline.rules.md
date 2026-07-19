# Cline rules — Virtual Card Lifecycle

Source of truth: `specifications/ai/AGENTS.md` + `product/specs/001-feature/spec.md`. Follow the
spec-driven workflow (`spec → architecture → tasks → code`); implement one `delivery/tasks.md` task per PR.

## Hard rules (regulated FinTech)
- No PAN/CVV anywhere but the vault boundary; reference cards by `network_token` + `last4`.
- Money = integer minor units / `Decimal`; one currency per card; no `float`.
- State changes go through the single state-machine fn (legal transitions only; `CLOSED` terminal).
- Writes are idempotent (`Idempotency-Key`) and optimistically concurrent (`If-Match`/ETag).
- One audit event per state change, in the same transaction (outbox).
- Deny by default + separation of duties; SCA + role for close / lifting compliance freeze.
- Fail closed on ambiguity or dependency loss; stable error codes; no sensitive detail in errors.

## Workflow
- Plan the task from its DoD in `delivery/tasks.md`; write the test first when practical (map to E-xx / FR).
- Self-verify `ruff → mypy → pytest → contract check`; keep diffs small; Conventional Commits `(T-0xx)`.
- Never change contracts/requirements silently — raise it and add an ADR.
