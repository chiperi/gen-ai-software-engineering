# Architecture

_Generated with the assistance of Claude Opus 4.8._

## High-level architecture

```mermaid
flowchart TD
    subgraph Client
        UI["React + Vite SPA (:5173)"]
    end
    subgraph Server["FastAPI (:3000)"]
        MAIN["main.py<br/>app, CORS, error handlers, /health"]
        ROUTES["routes/tickets.py<br/>REST endpoints"]
        IMP["importers.py<br/>CSV / JSON / XML parsers"]
        CLS["classifier.py<br/>keyword engine"]
        REPO["repository.py<br/>in-memory store + Lock"]
        MODELS["models.py<br/>Pydantic models + enums"]
        ERR["errors.py<br/>unified error shape"]
    end

    UI -->|"HTTP /api/* (proxied)"| MAIN
    MAIN --> ROUTES
    ROUTES --> IMP
    ROUTES --> CLS
    ROUTES --> REPO
    IMP --> MODELS
    CLS --> MODELS
    REPO --> MODELS
    MAIN -.-> ERR
```

## Components

| Component | Responsibility |
|-----------|----------------|
| `models.py` | Pydantic v2 models + enums; input validation (`TicketCreate`), entity (`Ticket`), partial update (`TicketUpdate`), `Classification`. |
| `repository.py` | Thread-safe in-memory `dict` store; filtering; sets `resolved_at` on resolve. |
| `routes/tickets.py` | All REST endpoints + `_classify_and_store` helper reused by create/import/classify. |
| `importers.py` | Parses each format to normalized rows, validates row-by-row, collects errors. |
| `classifier.py` | Deterministic keyword matching → category, priority, confidence, reasoning, keywords. |
| `errors.py` | Custom exceptions + handlers producing `{error, details}` uniformly. |
| `main.py` | Wires app, CORS, error handlers, router, and `/health`. |

## Data flow — bulk import with auto-classification

```mermaid
sequenceDiagram
    participant A as Agent (UI)
    participant API as FastAPI Router
    participant P as Importer
    participant V as TicketCreate (Pydantic)
    participant C as Classifier
    participant R as Repository

    A->>API: POST /tickets/import?auto_classify=true (file)
    API->>P: detect_format + parse (CSV/JSON/XML)
    P-->>API: list of raw rows
    loop each row
        API->>V: validate row
        alt valid
            V-->>API: TicketCreate
            API->>R: add(Ticket)
            API->>C: classify(subject, description)
            C-->>API: Classification
            API->>R: update category/priority + store classification
        else invalid
            V-->>API: ValidationError
            API->>API: append {row, message} to errors
        end
    end
    API-->>A: 200 { total, successful, failed, errors, created_ids }
```

## Design decisions & trade-offs

- **In-memory repository.** Keeps the assignment focused and tests fast/isolated.
  Trade-off: no persistence across restarts. The repository is a single class, so
  swapping in a database is localized.
- **Deterministic keyword classifier (not an LLM).** Fully testable, instant, no
  API keys or cost, and it directly satisfies the "keywords found + reasoning"
  requirement. Trade-off: less nuanced than an LLM; keyword tables must be
  curated. The interface (`classify_text`) makes an LLM swap-in straightforward.
- **stdlib-only parsers** (`csv`, `json`, `xml.etree`). No extra dependencies;
  row-level errors are collected so one bad row never aborts a whole import.
- **Unified error shape** across validation, not-found, and malformed-file cases,
  so the frontend has one code path for surfacing failures.
- **Vite dev proxy** (`/api` → `:3000`) avoids CORS config in development and
  keeps the API host out of the frontend source.

## Security considerations

- All input is validated by Pydantic (email format, string lengths, enum
  membership) before it reaches the store.
- Uploaded files are parsed defensively; parser exceptions become 400s, never
  stack traces.
- CORS is currently open (`*`) for local development — lock this down to the
  known frontend origin before any real deployment.
- No authentication layer yet; add one (e.g. token middleware) before exposing
  the API beyond localhost.

## Performance considerations

- Reads and writes are O(1)/O(n) over an in-memory dict; the `Lock` serializes
  writes, which the concurrent-request test (25 simultaneous creates) exercises.
- Classification is pure string matching — ~1000 classifications well under 2s
  (see [TESTING_GUIDE.md](TESTING_GUIDE.md) benchmarks).
- Import of 50 rows parses+validates in well under a second.
