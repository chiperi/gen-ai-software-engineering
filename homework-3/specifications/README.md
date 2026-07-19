# Virtual Card Lifecycle — `specifications/`

A layered, spec-driven specification bundle for a **regulated virtual card lifecycle service**
(issue → activate → freeze/unfreeze → set limits → view transactions → close). Documentation only —
no application code. Generated with **spec-forge** (stack: Python), then filled by hand.

## How to read this bundle (dependency order)

```
00-constitution.md                     immutable principles (P1–P8) — everything obeys these
        │
knowledge/                             glossary + business rules (BR-xxx) the spec cites
        │
product/specs/001-feature/spec.md      WHAT & WHY — layered spec (MO, FR, edge cases, verification, perf)
        │
architecture/                          HOW — plan, ADRs, NFR (numbers), threat model, observability, fitness fns
  ├─ plan.md · decisions/ (ADR-0001..0005)
  ├─ nfr.md · threat-model.md · observability.md · fitness-functions.md
  └─ traceability-matrix.md            requirement → design → task → test (no orphans)
        │
contracts/                             OpenAPI 3.1 (sync) + AsyncAPI 3.0 (events)
        │
delivery/tasks.md                      atomic, traceable tasks (waves, DoD)
        │
ai/                                    agent config: AGENTS.md (source of truth), editor rules, subagents
roles/                                 human/agent role personas (BA/SA/Designer/Developer)
platform/ · quality/                   runnable scaffolding: Docker, devcontainer, CI gates, pre-commit
```

## Directory map

| Path | What |
|------|------|
| [`00-constitution.md`](00-constitution.md) | 8 immutable principles (money exactness, PAN boundaries, audit, idempotency, least-privilege, fail-closed, traceability, privacy) |
| [`knowledge/`](knowledge/) | [glossary](knowledge/domain-glossary.md) + [business rules](knowledge/domain-business-rules.md) (state machine, BR-xxx) |
| [`product/specs/001-feature/spec.md`](product/specs/001-feature/spec.md) | the layered product spec — the graded centerpiece |
| [`architecture/`](architecture/) | [plan](architecture/plan.md), [ADRs](architecture/decisions/), [NFR](architecture/nfr.md), [threat model](architecture/threat-model.md), [observability](architecture/observability.md), [fitness functions](architecture/fitness-functions.md), [traceability](architecture/traceability-matrix.md) |
| [`contracts/`](contracts/) | [openapi.yaml](contracts/openapi.yaml), [asyncapi.yaml](contracts/asyncapi.yaml) |
| [`delivery/tasks.md`](delivery/tasks.md) | 30 atomic tasks in 4 waves, each with a Definition of Done |
| [`ai/AGENTS.md`](ai/AGENTS.md) | single source of truth for AI agents (+ [editor rules](ai/rules/), [subagents](ai/agents/)) |
| [`roles/`](roles/) | role personas for the spec-driven cycle |
| [`platform/`](platform/), [`quality/`](quality/) | Docker/devcontainer + CI quality gates (ruff, mypy, pytest, spectral, schemathesis, bandit, pip-audit, gitleaks) |

## Why it's built this way (rationale)

- **Layering over prose.** Intent is decomposed vision → mid-level objectives → NFR/policy →
  implementation notes → context → low-level tasks, so an engineer or an AI agent can build without
  guessing. Depth lives where it belongs (per-task acceptance criteria, not a wall of text).
- **Traceability is enforced, not hoped for.** Every FR/NFR flows to a design decision, a task, and a
  test in [`traceability-matrix.md`](architecture/traceability-matrix.md); a CI check (T-036) fails on
  any orphan. This is the spine of the constitution's Principle 7.
- **Numbers, not adjectives.** Non-functional expectations are measurable targets ([`nfr.md`](architecture/nfr.md),
  spec §11) — p95 budgets, freeze-effectiveness ≤ 2 s, 99.9% availability, 0 critical vulns — each with a
  verification method. Hypothetical figures are labelled *assumed targets* with justification.
- **FinTech risk drives the design.** PAN/CVV never leave the vault boundary; money is integer minor
  units; every state change is audited via a transactional outbox; writes are idempotent and
  optimistically concurrent; the system fails closed. These are principles, not afterthoughts.

## Industry best practices — and where they appear

| Practice | Where |
|----------|-------|
| PCI-DSS scope minimization (never hold PAN/CVV) | [`00-constitution.md`](00-constitution.md) P2, spec FR-003, [`threat-model.md`](architecture/threat-model.md) T-004, [`fitness-functions.md`](architecture/fitness-functions.md) FF-006 |
| Exact money (minor units / `Decimal`, no float) | P1, [ADR-0005](architecture/decisions/0005-money-minor-units.md), FF-008 |
| Idempotency keys for safe retries | P4, [ADR-0003](architecture/decisions/0003-idempotency-keys.md), spec FR-060 |
| Optimistic concurrency (no lost updates) | [ADR-0004](architecture/decisions/0004-optimistic-concurrency.md), spec FR-061 |
| Append-only, tamper-evident audit (outbox) | P3, [ADR-0002](architecture/decisions/0002-audit-transactional-outbox.md), FF-007 |
| STRIDE threat modeling + data classification | [`threat-model.md`](architecture/threat-model.md) |
| Strong Customer Authentication (PSD2-style) | spec FR-050/052 (close), BR-012 |
| Separation of duties / least privilege | P5, spec FR-063, threat T-006 |
| Fail-closed reliability | P6, spec FR-064, [`nfr.md`](architecture/nfr.md) NFR-010 |
| Fitness functions as CI governance (Neal Ford) | [`fitness-functions.md`](architecture/fitness-functions.md) |
| Contract-first APIs (OpenAPI/AsyncAPI) + conformance | [`contracts/`](contracts/), FF-005 |
| RED/USE metrics, SLOs, error budgets, no-PII logs | [`observability.md`](architecture/observability.md) |
| EARS + Given/When/Then requirements | [`product/specs/001-feature/spec.md`](product/specs/001-feature/spec.md) §5 |

## Verify

```bash
spec-forge validate      # gates over the bundle
spec-forge status        # lifecycle progress
```
