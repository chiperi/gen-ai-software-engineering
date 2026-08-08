# Skill — Unit tests and FIRST

Defines what a unit test in this project must satisfy, in terms that can be
checked after the suite runs. Used by `unit-test-generator` when writing tests
and `test-report.md`.

FIRST as an acronym is a slogan. A criterion that cannot be checked against a
finished test run is not a criterion. Every rule below states how it is
verified.

---

## 1. Scope

Cover **only the code listed in `fix-summary.md`**. That list is the boundary
of the work.

- New test files only, named `*.test.js` under `tests/`
- **Never modify an existing test.** A failing test is evidence, not an
  obstacle. If an existing test fails, report it and stop — do not adjust it
- `npm test` discovers `tests/**/*.test.js`, so a new file joins the suite
  without touching `package.json`

If a change described in `fix-summary.md` is not present in the source, report
the mismatch rather than writing a test around what is actually there.

---

## 2. FIRST, operationally

| Letter | Rule | How it is checked |
|--------|------|-------------------|
| **F**ast | Every test completes in **under 50 ms** | The runner reports per-test duration. The slowest test and its time go in the report |
| **I**ndependent | Any test passes on its own and in any order. No state shared between tests, no module-level mutable state carried across them, no test depending on another having run first | Run the new file alone, then the full suite. Both pass |
| **R**epeatable | Same result on any machine, at any time, offline. No wall clock, no randomness, no network, no writes to the filesystem, no dependence on locale or timezone | No `Date.now()`, `new Date()` without an argument, `Math.random()`, network calls or writes appear in the test. Fixtures are committed to the repository |
| **S**elf-validating | The result is pass or fail from assertions alone. No output a human must read to judge the outcome | Every test ends in at least one assertion. A test that cannot fail is a violation, not a passing test |
| **T**imely | The test covers a change described in `fix-summary.md`, written against the fixed behaviour | Each test names the change or defect it covers |

A test that reads the current output and asserts it matches satisfies none of
these. Decide what the correct value is, then assert that.

---

## 3. What to cover

For each changed function:

1. **The corrected behaviour** — the case the fix was made for
2. **Boundaries** — zero, one, empty collection, the ends of any valid range
3. **Just outside the boundaries** — the first invalid value on each side
4. **Invalid input types**, where the function is reachable with them
5. **Rejection paths** introduced by a security fix — that the dangerous input
   is now refused, and that legitimate input still works

Point 5 needs both halves. A test proving a malicious input is rejected, with
no test proving a valid one still passes, cannot tell a fix from a service
that refuses everything.

Prefer several small tests over one test with many assertions: when it fails,
the name alone should say what broke.

---

## 4. Not tests

| Anti-pattern | Why it is rejected |
|--------------|--------------------|
| Weakening an assertion until it passes | Turns the oracle into a description of current behaviour |
| Asserting whatever the code returns today | Same, one step earlier |
| Tests that must run in a fixed order | Breaks Independent; fails unpredictably later |
| Comparing whole objects when one field is under test | Unrelated changes make it fail; the failure names nothing |
| `try/catch` with no assertion in the `catch` | Passes whether or not the error was thrown |
| Testing unchanged modules to raise the count | Outside scope; hides how much of the change is really covered |

---

## 5. Self-check before writing the report

1. Run the full suite — everything passes
2. Run each new file on its own — everything passes
3. Run the suite a second time — identical result
4. Confirm the slowest test is under 50 ms
5. Confirm every new test maps to an entry in `fix-summary.md`

A failure at step 2 or 3 is a FIRST violation and goes in the report as one,
even if the full suite is green.

---

## 6. Required output

`test-report.md` must contain:

1. **Summary** — files added, tests added, total suite result
2. **Coverage of the change** — each entry from `fix-summary.md` and the tests
   covering it; entries with no test are listed as such, with the reason
3. **FIRST compliance** — each letter, how it was checked, the result
4. **Metrics** — the table below
5. **Violations** — anything failing section 5, or "none"
6. **References** — the files and functions covered

| Metric | Value |
|--------|-------|
| Test files added | |
| Tests added | |
| Suite result | `<pass>/<total>` |
| Slowest test | `<name>` — `<ms>` |
| Run twice, identical | yes / no |
| Each new file passes alone | yes / no |

Report measurements, not assurances. "Fast" is a claim; "slowest test 0.6 ms"
is evidence.

Close the file with:

```
=== STAGE RESULT ===
STAGE:    unit-test-generation
VERDICT:  PASS | FAIL
ADDED:    <tests added>
TESTS:    <pass>/<total>
SLOWEST_MS: <milliseconds>
FIRST_VIOLATIONS: <count>
=== END STAGE RESULT ===
```

`VERDICT: FAIL` if the suite is not green, if any FIRST violation stands, or if
`fix-summary.md` describes a change that the source does not contain.

The orchestrator reads this block. Field names and spelling are part of the
contract.
