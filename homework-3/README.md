# Homework 3 — Specification-Driven Design

> **Student Name**: Elena Chiperi
> **Date Submitted**: 16.07.2026
> **AI Tools Used**: [Claude Code]

---
**Feature:** Regulated **virtual card lifecycle** service (issue → activate → freeze/unfreeze →
set spending limits → view transactions → close), for end-users and internal ops/compliance.
**Deliverable:** a documentation-only specification package — no application code.

The full, layered specification is authored as a **spec-driven bundle** under
[`specifications/`](specifications/), generated with `spec-forge` and filled in phase by phase
(constitution → knowledge → spec → architecture → contracts → tasks → AI config). This README is the
graded entry point; the required artifacts map onto the bundle as shown below.

## Required deliverables → where they live

| Homework deliverable | In this repo |
|----------------------|--------------|
| `specification.md` (layered spec) | [specification.md](specification.md) → canonical [`specifications/product/specs/001-feature/spec.md`](specifications/product/specs/001-feature/spec.md) + the whole `specifications/architecture/` and `contracts/` layers |
| `agents.md` (AI guidelines) | [agents.md](agents.md) → canonical [`specifications/ai/AGENTS.md`](specifications/ai/AGENTS.md) |
| Editor / AI rules | [`specifications/ai/rules/copilot-instructions.md`](specifications/ai/rules/copilot-instructions.md) + [`specifications/ai/editors/`](specifications/ai/editors/) (Cursor, Windsurf, Cline, Junie, Aider) |
| `README.md` (rationale + best practices) | this file (+ the deeper map in [`specifications/README.md`](specifications/README.md)) |

## Task summary

Design a specification package for a finance feature in a **regulated** environment: auditable,
secure, with clear boundaries for sensitive data. The graded artifact is the specification itself —
how clearly the problem is decomposed, how traceable requirements are from goals to tasks, and how
well failure modes, verification, and non-functional expectations are anticipated. The chosen feature
is the **virtual card lifecycle** (the homework's primary example), assuming a hypothetical
**Python / FastAPI / PostgreSQL** stack.

## Rationale — why the spec is written this way

- **Multi-level intent, not prose.** Vision → mid-level objectives → NFR/policy → implementation notes
  → beginning/ending context → many small low-level tasks. Each layer is a distinct file/section so an
  engineer or an AI agent can execute without guessing. See the layer guide in
  [`spec.md` §0](specifications/product/specs/001-feature/spec.md).
- **Traceability is enforced.** Every FR/NFR flows requirement → design/ADR → task → test in the
  [traceability matrix](specifications/architecture/traceability-matrix.md); a CI check (task T-036)
  fails on any orphan. This makes "nothing gets lost" a gate, not a hope.
- **Performance targets are numbers with justification.** Latency budgets (freeze write p95 < 200 ms,
  authorization `evaluate` p95 < 50 ms), freeze-effectiveness ≤ 2 s, 99.9% availability, and 0 critical
  vulns are stated as measurable targets in [`nfr.md`](specifications/architecture/nfr.md) and spec §11,
  each labelled an *assumed target* with a reason (interactive-API budgets; a tight synchronous
  auth-path slice; a fraud-containment window). They are chosen to reflect real FinTech UX/ops, not to
  look impressive.
- **Verification depth matches risk.** The state machine, money math, and limit engine (the risk core)
  get property tests and ≥ 90% coverage; edge cases E-01…E-20 each have an expected behavior and a
  test; fitness functions ([`fitness-functions.md`](specifications/architecture/fitness-functions.md))
  turn governance into CI. Verification is defined per objective in
  [`spec.md` §10](specifications/product/specs/001-feature/spec.md).
- **Edge cases and failure modes are first-class.** A dedicated table (spec §9) pairs each situation
  with a user-visible outcome **and** its audit/compliance implication — not a generic security essay.

## Industry best practices — and where they appear

| Practice | Where in the spec |
|----------|-------------------|
| PCI-DSS scope minimization — never hold PAN/CVV | [constitution](specifications/00-constitution.md) P2 · spec FR-003 · [threat-model](specifications/architecture/threat-model.md) T-004 · FF-006 |
| Exact money (minor units / `Decimal`, no float) | constitution P1 · [ADR-0005](specifications/architecture/decisions/0005-money-minor-units.md) · FF-008 |
| Idempotency keys for safe retries | constitution P4 · [ADR-0003](specifications/architecture/decisions/0003-idempotency-keys.md) · spec FR-060 |
| Optimistic concurrency — no lost updates | [ADR-0004](specifications/architecture/decisions/0004-optimistic-concurrency.md) · spec FR-061 |
| Append-only, tamper-evident audit (transactional outbox) | constitution P3 · [ADR-0002](specifications/architecture/decisions/0002-audit-transactional-outbox.md) · FF-007 |
| STRIDE threat modeling + data classification | [threat-model.md](specifications/architecture/threat-model.md) |
| Strong Customer Authentication (PSD2-style) for sensitive actions | spec FR-050/052 · BR-012 |
| Separation of duties / least privilege | constitution P5 · spec FR-063 · threat T-006 |
| Fail-closed reliability | constitution P6 · spec FR-064 · [nfr.md](specifications/architecture/nfr.md) NFR-010 |
| Fitness functions as CI governance (Neal Ford) | [fitness-functions.md](specifications/architecture/fitness-functions.md) |
| Contract-first APIs (OpenAPI 3.1 / AsyncAPI 3.0) + conformance | [`contracts/`](specifications/contracts/) · FF-005 |
| Observability: RED/USE metrics, SLOs, error budgets, no-PII logs | [observability.md](specifications/architecture/observability.md) |
| Requirements in EARS + Given/When/Then, P1 = MVP | [spec §5](specifications/product/specs/001-feature/spec.md) |

## Verify the bundle

```bash
cd specifications && spec-forge validate   # structure · clarifications · measurable-success → all green
```
