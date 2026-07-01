# 🧪 Homework 1 — Backend Implementation Plan (TDD)

> **Author:** Elena Chiperi · **Stack:** Java 17 · Spring Boot 3 · Maven · JUnit 5 + MockMvc + AssertJ
>
> This is the Test-Driven Development plan for the Banking Transactions API specified in
> `PROMPT.md`. The build proceeds in small **Red → Green → Refactor** cycles: write a
> failing test first, write the minimum code to pass it, then clean up. Each cycle ends on
> green with all previous tests still passing.

---

## 1. TDD ground rules

- **Red → Green → Refactor**, one behavior at a time. Never write production code without a
  failing test that requires it.
- **Minimum to pass.** In the Green step, write the simplest code that makes the test pass.
  Improve design only in the Refactor step, with the tests as a safety net.
- **Tests define behavior, not implementation.** Never hard-code a value just to satisfy a
  test; implement the real logic so it generalizes to all valid inputs.
- **Keep the suite always green.** Run `mvn test` after every cycle; never commit red.
- **Commit per cycle.** One commit per completed cycle (`test: ...` + `feat: ...`), so git
  history reads as the TDD trail.

## 2. Test tooling & layout

- **JUnit 5** (Jupiter) as the runner; **AssertJ** for fluent assertions.
- **MockMvc** for the web layer (`@WebMvcTest` for controller slices, `@SpringBootTest` +
  `@AutoConfigureMockMvc` for full integration).
- Pure **unit tests** (plain JUnit, no Spring context) for services and validators — these
  are fast and form the base of the pyramid.

The backend lives in `homework-1/backend/`. All Maven commands run from `backend/`.

```
backend/
├── pom.xml
├── tests.json
└── src/
    ├── main/java/com/example/banking/
    │   ├── BankingApplication.java
    │   ├── model/        (Transaction, enums, request/response DTOs)
    │   ├── repository/   (in-memory store, ConcurrentHashMap)
    │   ├── service/      (TransactionService, BalanceService, ...)
    │   ├── validation/   (validators / Bean Validation annotations)
    │   ├── web/          (controllers, @RestControllerAdvice)
    │   └── config/       (rate-limit filter, CORS, beans)
    └── test/java/com/example/banking/
        ├── service/      (unit tests)
        ├── validation/   (unit tests)
        └── web/          (MockMvc tests)
```

**Test pyramid:** many fast unit tests (services, validators, balance/summary/interest
math) → fewer web-layer MockMvc tests (status codes, JSON shapes, error mapping) → a few
end-to-end integration tests (create → list → balance flow, rate limit).

**Naming:** `methodOrEndpoint_condition_expectedResult`, e.g.
`createTransaction_negativeAmount_returns400`. Use `@DisplayName` for readable reports.

## 3. Track tests in a structured file

Maintain `tests.json` (or a checklist) listing every planned test, its cycle, and status
(`pending` / `passing`). This keeps the suite auditable and makes it safe to continue work
across sessions. **Do not delete or weaken tests** to make the build pass — that hides
missing or broken functionality.

---

## 4. The cycles

Each cycle lists the **RED** tests to write first, the **GREEN** code that makes them pass,
and **REFACTOR** notes. "DoD" = the cycle's definition of done.

### Cycle 0 — Walking skeleton
- **RED:**
  - `contextLoads()` — the Spring context starts.
  - `getTransactions_whenEmpty_returns200AndEmptyArray`.
- **GREEN:** Spring Boot app on port 3000; empty `TransactionController` with
  `GET /transactions` returning `[]`; in-memory repository stub.
- **REFACTOR:** wire package structure; add AssertJ; create `tests.json`.
- **DoD:** app boots, one endpoint green.

### Cycle 1 — Create & retrieve a transaction (Task 1)
- **RED (web):**
  - `createTransaction_validBody_returns201WithGeneratedFields` — response has non-null
    `id` (UUID), server-set `timestamp` (ISO 8601), `status == "completed"`, and echoes
    input fields.
  - `getTransactions_afterCreate_returnsListWithIt` (200).
  - `getTransactionById_existing_returns200WithTransaction`.
  - `getTransactionById_unknown_returns404` with body `{error, id}`.
- **RED (unit):** `TransactionService.create` stores and returns a transaction with a UUID
  and timestamp.
- **GREEN:** `Transaction` model (use **BigDecimal** for amount), enums for `type`/`status`,
  `ConcurrentHashMap` repository, service create/findAll/findById, controller wiring.
- **REFACTOR:** split request DTO from stored entity; centralize id/timestamp generation.
- **DoD:** core happy path + 404 green.

### Cycle 2 — Validation & structured errors (Task 2)
- **RED (unit, validators):**
  - amount: rejects `<= 0`; rejects more than 2 decimal places; accepts valid.
  - account format: accepts `ACC-12345` / `ACC-AB123`; rejects `12345`, `ACC-`, `ACCT-1`.
  - currency: accepts USD/EUR/GBP/JPY; rejects `XYZ`, lowercase, empty.
  - type: accepts the three enum values; rejects others.
- **RED (web):**
  - `createTransaction_negativeAmount_returns400` with `details` containing
    `{field:"amount", ...}`.
  - `createTransaction_invalidCurrency_returns400` with `field:"currency"`.
  - `createTransaction_badAccountFormat_returns400` with `field:"fromAccount"`.
  - `createTransaction_multipleErrors_returnsAllDetails` — `error:"Validation failed"` and
    a `details[]` with one entry per broken field (matches the example in `PROMPT.md`).
- **GREEN:** Bean Validation annotations (`@Positive`, `@Pattern`, custom currency check) +
  a `@RestControllerAdvice` mapping `MethodArgumentNotValidException` to the structured
  body.
- **REFACTOR:** extract currency set / decimal-scale check into reusable validators.
- **DoD:** every validation rule has a red-then-green test; error JSON matches the spec.

### Cycle 3 — Account balance (Task 1)
- **RED (unit, BalanceService):**
  - deposit increases `toAccount` balance.
  - withdrawal decreases `fromAccount` balance.
  - transfer decreases `fromAccount` and increases `toAccount`.
  - only `completed` transactions count toward the balance.
  - unknown account → balance `0`.
- **RED (web):** `getBalance_existingAccount_returns200WithComputedBalance`.
- **GREEN:** `BalanceService` computing from the stored transactions (BigDecimal math);
  `GET /accounts/{accountId}/balance` endpoint.
- **REFACTOR:** share an "transactions for account" helper with later features.
- **DoD:** balance math proven by unit tests + one web test.

### Cycle 4 — Transaction history / filtering (Task 3)
- **RED (web):**
  - `list_filterByAccountId_matchesFromOrTo`.
  - `list_filterByType_returnsOnlyThatType`.
  - `list_filterByDateRange_inclusiveBounds`.
  - `list_combinedFilters_appliesAllAsAnd`.
  - `list_noMatches_returnsEmptyArray`.
- **GREEN:** optional query params (`accountId`, `type`, `from`, `to`) applied as combined
  predicates in the service.
- **REFACTOR:** compose filters as a single predicate chain; parse dates once.
- **DoD:** each filter and the combination are green.

### Cycle 5 — Account summary (Task 4A)
- **RED (unit + web):** `summary` returns `totalDeposits`, `totalWithdrawals`,
  `transactionCount`, `mostRecentTransactionDate` for an account; empty account →
  zeros / null date.
- **GREEN:** `SummaryService` + `GET /accounts/{accountId}/summary`.
- **REFACTOR:** reuse the per-account transaction helper from Cycle 3.
- **DoD:** summary numbers proven on a known dataset.

### Cycle 6 — Simple interest (Task 4B)
- **RED:**
  - `interest = balance * rate * (days / 365)` on a known balance (unit test on the math).
  - `getInterest_returnsInputsAndResult` (web).
  - `getInterest_missingOrInvalidParams_returns400` (decide: `rate`/`days` required).
- **GREEN:** interest endpoint reusing `BalanceService`.
- **REFACTOR:** keep monetary rounding consistent (BigDecimal scale/rounding mode).
- **DoD:** interest math + param handling green.

### Cycle 7 — CSV export (Task 4C)
- **RED (web):**
  - `exportCsv_returns200_textCsv_withAttachmentHeader`.
  - `exportCsv_bodyHasHeaderRowAndOneLinePerTransaction`.
- **GREEN:** `GET /transactions/export?format=csv` producing `text/csv`, a
  `Content-Disposition: attachment` header, a header row, and CSV rows.
- **REFACTOR:** extract CSV serialization; escape commas/quotes correctly.
- **DoD:** CSV content-type, headers, and rows verified.

### Cycle 8 — Rate limiting (Task 4D)
- **RED:**
  - `withinLimit_requestsSucceed`.
  - `overLimit_returns429WithJsonBody` — drive with a low, test-configurable limit so the
    test is fast; assert body `{error:"Too Many Requests", message:...}`.
- **GREEN:** in-memory per-IP counter in a servlet `Filter`/`HandlerInterceptor`; limit and
  window injected from config (low value in tests, 100/min in prod).
- **REFACTOR:** thread-safe counter; clean expired windows.
- **DoD:** 429 path proven without slowing the suite.

### Cycle 9 — Hardening, integration & refactor
- **RED (integration):** `@SpringBootTest` end-to-end flow — create deposit + transfer,
  then assert balance, summary, and list filtering are mutually consistent.
- **GREEN:** fix any gaps surfaced by the full-context test.
- **REFACTOR:** finalize `@RestControllerAdvice` (404, 400, 429, 500), remove duplication,
  ensure consistent JSON error shape, confirm no `float`/`double` for money.
- **DoD:** all tests green; coverage spans every endpoint and rule.

---

## 5. Suggested test catalog (`tests.json` seed)

```json
[
  {"cycle":0,"name":"contextLoads","status":"pending"},
  {"cycle":0,"name":"getTransactions_whenEmpty_returns200AndEmptyArray","status":"pending"},
  {"cycle":1,"name":"createTransaction_validBody_returns201WithGeneratedFields","status":"pending"},
  {"cycle":1,"name":"getTransactionById_unknown_returns404","status":"pending"},
  {"cycle":2,"name":"createTransaction_negativeAmount_returns400","status":"pending"},
  {"cycle":2,"name":"createTransaction_invalidCurrency_returns400","status":"pending"},
  {"cycle":2,"name":"createTransaction_badAccountFormat_returns400","status":"pending"},
  {"cycle":2,"name":"createTransaction_multipleErrors_returnsAllDetails","status":"pending"},
  {"cycle":3,"name":"balance_onlyCompletedTransactionsCount","status":"pending"},
  {"cycle":3,"name":"getBalance_existingAccount_returns200WithComputedBalance","status":"pending"},
  {"cycle":4,"name":"list_combinedFilters_appliesAllAsAnd","status":"pending"},
  {"cycle":5,"name":"summary_returnsTotalsCountAndMostRecentDate","status":"pending"},
  {"cycle":6,"name":"interest_isBalanceTimesRateTimesDaysOver365","status":"pending"},
  {"cycle":7,"name":"exportCsv_returns200_textCsv_withAttachmentHeader","status":"pending"},
  {"cycle":8,"name":"overLimit_returns429WithJsonBody","status":"pending"},
  {"cycle":9,"name":"endToEnd_create_balance_summary_consistent","status":"pending"}
]
```

## 6. Commands

```bash
# all commands run from homework-1/backend/
mvn test                    # run the whole suite (run after every cycle)
mvn -Dtest=ClassName test   # run a single test class
mvn spring-boot:run         # start the API on :3000 for a manual smoke test
```

## 7. Overall Definition of Done

- Every cycle above is green and no test was deleted or weakened to get there.
- Coverage spans all Task 1–3 endpoints, every Task 2 validation rule, and all four Task 4
  features.
- `mvn test` passes from a clean checkout; the app starts and a manual smoke test of the
  sample requests in `demo/` succeeds.
- Money uses BigDecimal throughout; error responses follow the single structured shape.

---

### How to drive this with Claude Code
Hand Claude `PROMPT.md` plus this plan and instruct it to work **one cycle at a time**:
write the RED tests, confirm they fail, implement the GREEN code, run `mvn test`,
refactor, and only then move to the next cycle. Ask it to report the real test output after
each cycle rather than assuming success.
