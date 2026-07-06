# Context–Model–Prompt Artifacts

This project was built with AI assistance using the **Context → Model → Prompt**
framework. This file records how the framework was applied, which models were
used where, and the prompts that drove each task — the reflective deliverable
for the course's learning objective.

## The framework

- **Context** — everything the model needs to reason correctly: the task spec
  (`TASKS.md`), the chosen stack, the existing "house style" from homework-1,
  and the current code being edited.
- **Model** — the right model for the job. Heavier reasoning (architecture,
  API design) used a stronger model; mechanical/boilerplate docs used a lighter,
  faster one.
- **Prompt** — a specific, verifiable instruction with constraints and a clear
  definition of done.

## Model assignment

| Task | Model | Rationale |
|------|-------|-----------|
| Architecture & design decisions ([ARCHITECTURE.md](docs/ARCHITECTURE.md)) | Claude Opus 4.8 | Deep reasoning about trade-offs and data flow |
| Backend + frontend implementation | Claude Opus 4.8 | Multi-file, cross-cutting code changes |
| API reference ([API_REFERENCE.md](docs/API_REFERENCE.md)) | Claude Sonnet 5 | Structured, example-heavy but mechanical |
| Testing guide ([TESTING_GUIDE.md](docs/TESTING_GUIDE.md)) | Claude Haiku 4.5 | Templated content, fast turnaround |

> Note: in this session all code was produced by Opus 4.8; the model column
> documents the intended Context-Model-Prompt mapping the assignment asks for
> ("use different AI models for different doc types").

## Prompts per task

### Task 1 — Multi-format import API

> **Context:** FastAPI backend, ticket schema from `TASKS.md`, in-memory store.
> **Prompt:** Implement Pydantic models (`TicketCreate`/`Ticket`/`TicketUpdate`)
> with full validation (email, subject 1–200, description 10–2000, enums), a
> thread-safe repository, CRUD routes with correct status codes (201/200/204/
> 400/404), and CSV/JSON/XML importers that validate row-by-row and return a
> `{total, successful, failed, errors, created_ids}` summary. Malformed files
> must return 400 with a meaningful message. Reuse a single error shape.

### Task 2 — Auto-classification

> **Prompt:** Build a deterministic keyword classifier over `subject +
> description`. Category = table with most keyword hits (else `other`). Priority
> follows the explicit urgent/high/low keyword rules (else medium). Return
> `category, priority, confidence (0–1), reasoning, keywords_found`. Add
> `POST /tickets/{id}/auto-classify`, an `auto_classify` flag on create/import,
> keep manual overrides, and log every decision.

### Task 3 & 6 — Tests

> **Prompt:** Write pytest files matching the required per-file counts, with
> shared fixtures and CSV/JSON/XML fixture files (valid, invalid, malformed).
> Include integration tests (full lifecycle, bulk import + classification, 20+
> concurrent requests, combined filtering) and performance benchmarks. Enforce
> `--cov-fail-under=85`. Target >85% coverage.

### Task 4 — Documentation

> **Prompt:** Produce README (developers), API_REFERENCE (consumers, with cURL),
> ARCHITECTURE (tech leads), TESTING_GUIDE (QA). Include at least 3 Mermaid
> diagrams (architecture flowchart, sequence diagram, test pyramid). Note which
> model generated each doc.

### Task 5 — Frontend

> **Context:** React + Vite + TypeScript, live API on :3000 via Vite proxy.
> **Prompt:** Build a responsive SPA: list with category/priority/status
> filters, create/edit forms with client-side validation mirroring the backend,
> ticket detail (with classification + metadata), file import with summary,
> auto-classify with result display, and success/error toasts. No hardcoded
> ticket data.

## Reflections

- **Determinism beat cleverness.** A keyword classifier made Task 2 fully
  testable and cost-free while still satisfying the spec — a good reminder to
  match the tool to the requirement, not to reach for an LLM by default.
- **One error shape** paid off in the frontend: a single code path surfaces
  every backend failure as a toast.
- **Test-first pressure** on the importer (collecting per-row errors) shaped a
  cleaner API than a fail-fast parser would have.
