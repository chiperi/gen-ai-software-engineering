# Specification — Virtual Card Lifecycle (entry point)

> This is the top-level entry point for the layered specification required by the homework. The full,
> canonical layered spec lives in the spec-driven bundle; this page states the north star and routes to
> every layer so nothing is hidden behind a folder.
>
> **Canonical layered spec:** [`specifications/product/specs/001-feature/spec.md`](specifications/product/specs/001-feature/spec.md)

## High-Level Objective
Give end-users self-service control over the full lifecycle of a virtual payment card — issue,
activate, freeze/unfreeze, set spending limits, and view transactions, through to permanent closure —
in a way that is **auditable, idempotent, and safe for a regulated (PCI-DSS / PSD2-style)
environment**.

**Scope boundary:** this feature owns the card's *lifecycle state, spending limits, audit trail, and a
read model of its transactions* — it does **not** build the authorization network, the funding/ledger
settlement, the PAN/token vault, KYC, or any UI.

## Stakeholders
End-user (cardholder), internal ops/compliance, the fraud service (system actor), and an offline
auditor/regulator. Powers and explicit "cannot" boundaries: [spec §3](specifications/product/specs/001-feature/spec.md).

## The layered specification — where each layer lives

| Layer | File / section |
|-------|----------------|
| Immutable principles (P1–P8) | [`00-constitution.md`](specifications/00-constitution.md) |
| Glossary + business rules (BR-xxx, state machine) | [`knowledge/`](specifications/knowledge/) |
| High-level objective + scope | [spec §2](specifications/product/specs/001-feature/spec.md) |
| Mid-level objectives (MO) + measurable success criteria (SC) | [spec §4](specifications/product/specs/001-feature/spec.md) |
| Functional requirements (EARS + Given/When/Then, FR-xxx, P1=MVP) | [spec §5](specifications/product/specs/001-feature/spec.md) |
| Non-functional & policy (numbers) | [spec §6](specifications/product/specs/001-feature/spec.md) + [`nfr.md`](specifications/architecture/nfr.md) |
| Implementation notes (guardrails) | [spec §7](specifications/product/specs/001-feature/spec.md) |
| Context (beginning / ending state) | [spec §8](specifications/product/specs/001-feature/spec.md) |
| Edge cases & failure modes (E-01…E-20) | [spec §9](specifications/product/specs/001-feature/spec.md) |
| Verification (per objective) | [spec §10](specifications/product/specs/001-feature/spec.md) |
| Performance budgets (assumed targets, justified) | [spec §11](specifications/product/specs/001-feature/spec.md) |
| Low-level tasks (atomic, DoD) | [spec §12](specifications/product/specs/001-feature/spec.md) → [`delivery/tasks.md`](specifications/delivery/tasks.md) |
| Architecture (plan, ADRs) | [`architecture/plan.md`](specifications/architecture/plan.md) + [`decisions/`](specifications/architecture/decisions/) |
| Threat model (STRIDE), observability, fitness functions | [`architecture/`](specifications/architecture/) |
| Contracts (OpenAPI / AsyncAPI) | [`contracts/`](specifications/contracts/) |
| Traceability (requirement → design → task → test) | [`traceability-matrix.md`](specifications/architecture/traceability-matrix.md) |

## Cross-cutting requirements (as the homework requires, integrated — not afterthoughts)
- **Edge cases & failure modes:** [spec §9](specifications/product/specs/001-feature/spec.md) — table of 20 with user-visible outcome + audit implication.
- **Verification:** [spec §10](specifications/product/specs/001-feature/spec.md) — how each mid-level objective is proven, with test categories and fixtures.
- **Expected performance:** [spec §11](specifications/product/specs/001-feature/spec.md) + [`nfr.md`](specifications/architecture/nfr.md) — measurable budgets, each an *assumed target* with rationale.

See [`specifications/README.md`](specifications/README.md) for the full bundle map and the industry
best-practices index.
