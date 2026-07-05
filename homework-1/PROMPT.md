# 🎯 Homework 1 — Master Prompt for Claude

> **Author:** Elena Chiperi · **AI tool:** Claude Code · **Target stack:** Java 17 + Spring Boot 3
>
> This file contains the single, production-grade prompt used to generate the Banking
> Transactions API for Homework 1. It is engineered according to Anthropic's official
> *Prompting best practices* (see the mapping in the appendix at the end). To reproduce
> the result, paste everything inside the `BEGIN PROMPT` / `END PROMPT` block into Claude
> Code from the `homework-1/` directory.

---

## ▶️ How to use this prompt

1. Open Claude Code with the working directory set to `homework-1/`.
2. Copy the entire block between `<!-- BEGIN PROMPT -->` and `<!-- END PROMPT -->`.
3. Paste it as your first message and let Claude plan, then approve execution.
4. Run the resulting app and capture screenshots for `docs/screenshots/`.

---

<!-- BEGIN PROMPT -->

<role>
You are a senior backend engineer specializing in Java and Spring Boot, writing
production-quality REST APIs. You value clean architecture, clear validation, meaningful
error messages, and tests that prove behavior. You write code a reviewer can read once
and understand.
</role>

<context>
This is an academic assignment ("AI-Assisted Development" course, Homework 1). The work
will be reviewed via a pull request and graded on: functionality (30%), AI-usage
documentation (25%), code quality (20%), documentation (15%), and demo/screenshots (10%).
The reviewer may be unfamiliar with the branch, so clarity, runnability, and a clean
project structure matter as much as correctness. There is no database — all state lives
in memory for the lifetime of the process.
</context>

<objective>
Build a minimal but professional REST API for banking transactions in Java with Spring
Boot. Implement the four required task groups, ALL four optional features, and an
automated test suite. Produce a project that starts with a single command and is fully
documented.
</objective>

<tech_stack>
- Language: Java 17
- Framework: Spring Boot 3.x (spring-boot-starter-web, spring-boot-starter-validation)
- Build tool: Maven (provide a working `pom.xml` and the Maven wrapper `mvnw`)
- Storage: in-memory, thread-safe (e.g. `ConcurrentHashMap`) — no database, no JPA
- Tests: JUnit 5 + Spring Boot Test with `MockMvc`
- Server port: 3000
Do not introduce extra frameworks, databases, or infrastructure beyond this list unless a
requirement genuinely cannot be met otherwise.
</tech_stack>

<project_structure>
The backend MUST live in its own `backend/` directory: `homework-1/backend/`. Put the
Maven project (`pom.xml`, `src/main`, `src/test`, `.gitignore`, `tests.json`) inside
`backend/`. Keep this folder self-contained so a separate `frontend/` can sit alongside it
without interfering. All Maven commands are run from `homework-1/backend/`.
</project_structure>

<data_model>
Transaction:
- id: String, auto-generated (UUID)
- fromAccount: String
- toAccount: String
- amount: number (BigDecimal — money must not use float/double)
- currency: String (ISO 4217: USD, EUR, GBP, JPY, ...)
- type: String enum (deposit | withdrawal | transfer)
- timestamp: ISO 8601 datetime, set by the server at creation
- status: String enum (pending | completed | failed); new transactions default to completed

Balance rules (only `completed` transactions count):
- deposit: increases the balance of `toAccount`
- withdrawal: decreases the balance of `fromAccount`
- transfer: decreases `fromAccount` and increases `toAccount` by `amount`
</data_model>

<requirements>

<task_1_core_api>
Implement these endpoints with correct HTTP status codes (200, 201, 400, 404):
- POST   /transactions                      → create a transaction, return 201 + the created object
- GET    /transactions                      → list all transactions, return 200
- GET    /transactions/{id}                 → return one transaction, or 404 if not found
- GET    /accounts/{accountId}/balance      → return the computed balance for an account
Include basic error handling via a centralized exception handler (`@RestControllerAdvice`).
</task_1_core_api>

<task_2_validation>
Validate every incoming transaction and return structured, meaningful errors:
- amount: must be a positive number with at most 2 decimal places
- account numbers (fromAccount / toAccount): must match the format `ACC-XXXXX`, where X is
  alphanumeric (regex such as `^ACC-[A-Za-z0-9]+$`)
- currency: must be a valid ISO 4217 code (accept at least USD, EUR, GBP, JPY; reject
  unknown codes)
- type: must be one of deposit | withdrawal | transfer
On validation failure return HTTP 400 with the exact response shape shown in the examples.
</task_2_validation>

<task_3_history>
Support filtering on GET /transactions via query parameters, combinable:
- ?accountId=ACC-12345   (matches fromAccount OR toAccount)
- ?type=transfer
- ?from=2024-01-01&to=2024-01-31   (inclusive date range over timestamp)
When multiple filters are present, apply them together (logical AND).
</task_3_history>

<task_4_additional>
Implement ALL FOUR optional features:

A. Summary endpoint
   GET /accounts/{accountId}/summary → { totalDeposits, totalWithdrawals,
   transactionCount, mostRecentTransactionDate }

B. Simple interest
   GET /accounts/{accountId}/interest?rate=0.05&days=30 → simple interest on the current
   balance: interest = balance * rate * (days / 365). Return the inputs and the result.

C. CSV export
   GET /transactions/export?format=csv → return the transactions as CSV with a header row
   and `Content-Type: text/csv` plus a `Content-Disposition: attachment` header.

D. Rate limiting
   Limit each client IP to 100 requests per minute. When exceeded, return HTTP 429 with a
   clear JSON body. Implement with a lightweight in-memory approach (a filter or
   interceptor) — do not add external rate-limit infrastructure.
</task_4_additional>

<task_5_tests>
Write an automated test suite with JUnit 5 + MockMvc covering at least:
- happy-path creation (201) and retrieval (200) of a transaction
- validation failures returning 400 with the structured error body (bad amount, bad
  account format, invalid currency)
- 404 for a non-existent transaction id
- correct balance computation across deposit / withdrawal / transfer
- at least one test per Task 4 feature (summary, interest, CSV export, rate limit 429)
Tests must verify real behavior, not just status codes where the body matters.
</task_5_tests>

</requirements>

<examples>
Use these as the canonical request/response contracts. Match the JSON shapes exactly.

<example name="create-transaction-success">
Request:
  POST /transactions
  Content-Type: application/json
  {
    "fromAccount": "ACC-12345",
    "toAccount": "ACC-67890",
    "amount": 100.50,
    "currency": "USD",
    "type": "transfer"
  }
Response: 201 Created
  {
    "id": "f1c2...uuid",
    "fromAccount": "ACC-12345",
    "toAccount": "ACC-67890",
    "amount": 100.50,
    "currency": "USD",
    "type": "transfer",
    "timestamp": "2024-01-15T10:30:00Z",
    "status": "completed"
  }
</example>

<example name="validation-error">
Request: POST /transactions with amount -5 and currency "XYZ"
Response: 400 Bad Request
  {
    "error": "Validation failed",
    "details": [
      {"field": "amount", "message": "Amount must be a positive number"},
      {"field": "currency", "message": "Invalid currency code"}
    ]
  }
</example>

<example name="not-found">
Request: GET /transactions/does-not-exist
Response: 404 Not Found
  {
    "error": "Transaction not found",
    "id": "does-not-exist"
  }
</example>

<example name="rate-limited">
Response when the per-IP limit is exceeded: 429 Too Many Requests
  {
    "error": "Too Many Requests",
    "message": "Rate limit of 100 requests per minute exceeded"
  }
</example>
</examples>

<engineering_principles>
- Keep solutions simple and focused. Do not add features, abstractions, or configurability
  beyond what is requested. The right amount of complexity is the minimum needed for this
  task.
- Only validate at system boundaries (incoming requests). Trust internal code.
- Write a high-quality, general-purpose solution. Implement the real logic; never hard-code
  values to make a specific test pass. Tests verify correctness — they do not define it.
- Use BigDecimal for all monetary math; never float/double.
- If any requirement is ambiguous or infeasible, tell me rather than silently working
  around it.
- Never claim something works without verifying it. After writing code, build and run the
  tests; report real results.
</engineering_principles>

<workflow>
Work in this order and keep me oriented with brief progress notes:
1. Plan: propose a concise project structure (controllers, services, models, validators,
   exception handler, config) before writing code. Do not write code until the plan is set.
2. Implement Task 1 → 2 → 3 → 4, in order, in small reviewable steps.
3. Add the test suite (Task 5) and make it pass.
4. Generate the documentation deliverables (see below).
5. Run `mvn test` (from `backend/`) and a manual smoke test; report the actual output.
</workflow>

<deliverables>
The backend project lives in `homework-1/backend/`:
- `backend/src/` — the complete Spring Boot application with a clean package structure
- `backend/pom.xml` — builds with a local Maven install or IntelliJ's bundled Maven
- `backend/.gitignore` excluding `target/`, IDE files, and `.env`
- `backend/tests.json` — the TDD test tracker

At `homework-1/` level (covering the whole submission):
- `README.md` — overview, features implemented, architecture decisions, AI tools used,
  author (Elena Chiperi)
- `HOWTORUN.md` — exact step-by-step run + test instructions, environment setup, and
  example requests
- `demo/run.sh` — script that starts the application
- `demo/sample-requests.http` (or `.sh`) — runnable sample calls covering every endpoint
- `demo/sample-data.json` — sample transactions
</deliverables>

<definition_of_done>
The task is complete only when ALL of these are true:
- The app starts on port 3000 with a single command.
- All Task 1–3 endpoints behave per the examples, with correct status codes.
- All four Task 4 features work.
- `mvn test` (run from `backend/`) passes and the suite covers the cases in <task_5_tests>.
- README.md and HOWTORUN.md are present, accurate, and sufficient for an unfamiliar
  reviewer to run and verify the project.
- The sample requests in `demo/` actually work against the running server.
</definition_of_done>

<self_check>
Before declaring the work finished, verify each item in <definition_of_done> against the
running application and the test output. List anything that does not pass and fix it. Do
not report success for anything you have not actually executed.
</self_check>

<!-- END PROMPT -->

---

## 📚 Appendix — How this prompt applies Anthropic's best practices

This prompt is engineered from Anthropic's official *Prompting best practices*. Each
technique below maps to a section above:

| Technique (Anthropic) | Where it's applied here |
|---|---|
| **Give Claude a role** | `<role>` sets a senior Spring Boot engineer persona to focus tone and quality. |
| **Add context / motivation** | `<context>` explains the grading rubric and reviewer, so Claude optimizes for what matters. |
| **Be clear and direct, sequential steps** | `<requirements>` and `<workflow>` give numbered, ordered, unambiguous tasks. |
| **Structure prompts with XML tags** | The whole prompt uses descriptive, nested XML tags so instructions, data, and examples never blur together. |
| **Use examples (few-shot)** | `<examples>` gives diverse, canonical request/response contracts (success, validation error, 404, 429). |
| **Tell Claude what to do, not what not to do** | Requirements are phrased as positive, concrete contracts. |
| **Avoid over-engineering** | `<engineering_principles>` caps scope to the minimum needed. |
| **Don't hard-code to tests** | `<engineering_principles>` requires a general solution; tests verify, not define. |
| **Minimize hallucinations / verify** | `<self_check>` requires running code and reporting real results. |
| **Define success criteria** | `<definition_of_done>` gives an explicit, checkable completion bar. |
| **Incremental progress & state** | `<workflow>` enforces plan → implement → test → document in small steps. |

**Source:** Anthropic — *Prompting best practices*,
https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
