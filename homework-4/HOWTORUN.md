# 🚀 How to Run

> **Student Name**: Elena Chiperi
> Companion to [README.md](README.md).

---

## 0. Prerequisites

| Requirement | Check | Notes |
|---|---|---|
| Node.js ≥ 22 | `node -v` | uses the built-in `node --test` runner |
| npm | `npm -v` | only for running scripts — **the project has zero dependencies** |
| Claude Code CLI | `claude --version` | required **only** for `npm run pipeline` |
| `curl` | `curl --version` | for the manual HTTP checks below |

```bash
cd homework-4
```

No `npm install` is needed. There are no dependencies to install.

---

## 1. Run the application

```bash
npm start
```

```
cart service listening on http://localhost:3000
```

Use a different port with `PORT=3001 npm start`.

### Endpoints

| Method | Path | Body / query |
|---|---|---|
| `GET` | `/coupon?code=SAVE10` | — |
| `POST` | `/checkout` | `{"items":[{"price":10,"quantity":2}],"coupon":"SAVE10"}` |

### Manual verification (in a second terminal)

```bash
# 1. legitimate coupon
curl 'localhost:3000/coupon?code=SAVE10'
# → {"code":"SAVE10","percent":10}

# 2. path traversal — must be REJECTED
curl 'localhost:3000/coupon?code=../credentials'
# → {"error":"invalid coupon code"}

curl 'localhost:3000/coupon?code=../../../../etc/passwd'
# → {"error":"invalid coupon code"}

# 3. checkout: 2×$10 + 3×$5 = 35
curl -X POST localhost:3000/checkout \
  -d '{"items":[{"price":10,"quantity":2},{"price":5,"quantity":3}]}'
# → {"total":35}

# 4. same with a 10% coupon = 31.5
curl -X POST localhost:3000/checkout \
  -d '{"items":[{"price":10,"quantity":2},{"price":5,"quantity":3}],"coupon":"SAVE10"}'
# → {"total":31.5}
```

Stop the server with `Ctrl+C`.

---

## 2. Run the tests

```bash
npm test
```

Expected on the current (post-pipeline) code:

```
# tests 22
# pass 22
# fail 0
```

Run a single test by name — this is also how test **independence** is verified:

```bash
node --test --test-name-pattern="applyDiscount rejects an out-of-range percent"
```

---

## 3. Run the four-agent pipeline

> ⚠️ **This modifies files in `src/` and `tests/`.** Commit or stash your work
> first. The pipeline makes four `claude` calls and takes roughly 10–15 minutes.

```bash
npm run pipeline
```

or equivalently:

```bash
bash scripts/run-pipeline.sh
```

### To reproduce the full before → after run

The committed code is already fixed. To watch the pipeline do the work from
scratch, restore the seeded "before" state first:

```bash
git log --oneline --all | grep "seed cart service"     # find the before-commit
git checkout <that-commit> -- src/ tests/
npm test        # → 12 tests, 5 pass, 7 fail   (the baseline)
npm run pipeline
```

### What happens, stage by stage

```
Pre-flight        verify inputs exist, record the test baseline
   ↓
1. research-verifier   [opus]    → context/bugs/001/research/verified-research.md
   ↓ GATE 1   HALT → stop · CONDITIONAL → check plan exclusions · PASS → continue
2. bug-fixer           [sonnet]  → context/bugs/001/fix-summary.md  + edits to src/
   ↓ GATE 2   requires OVERALL_STATUS=SUCCESS and a non-empty FILES_CHANGED
3. security-verifier   [opus]    → context/bugs/001/security-report.md
   ↓ GATE 3   CRITICAL/HIGH findings → exit code 2 (reports still complete)
4. unit-test-generator [sonnet]  → context/bugs/001/test-report.md
                                  + tests/*.generated.test.js
   ↓ GATE 4   requires TESTS_FAILED=0 and FIRST_VIOLATIONS=0
Summary
```

Models and tool permissions are **not** hard-coded in the script — it reads them
from each agent's frontmatter:

```bash
model="$(frontmatter_field "$agent_file" model)"
tools="$(frontmatter_field "$agent_file" tools | tr -d ' ')"
claude -p "$prompt" --model "$model" --allowed-tools "$tools" --permission-mode acceptEdits
```

Change the model in `agents/*.agent.md` and the next run picks it up. There is no
second place to update.

### Exit codes

| Code | Meaning |
|---|---|
| `0` | all four gates passed |
| `1` | a gate failed, or an agent did not produce its output file |
| `2` | pipeline completed, but security review found CRITICAL/HIGH issues |

---

## 4. Inspect the results

### Machine-readable verdicts — the fastest overview

```bash
for f in context/bugs/001/research/verified-research.md \
         context/bugs/001/fix-summary.md \
         context/bugs/001/security-report.md \
         context/bugs/001/test-report.md; do
  echo "=== $(basename "$f") ==="
  sed -n '/MACHINE-READABLE VERDICT/,/END VERDICT/p' "$f" | grep -E "^[A-Z_0-9]+:"
done
```

### Full reports

| File | Contents |
|---|---|
| `context/bugs/001/research/verified-research.md` | verified claims, discrepancies with class and evidence, quality level |
| `context/bugs/001/fix-summary.md` | each change with before/after and its test result |
| `context/bugs/001/security-report.md` | findings with severity, `file:line`, exploitation scenario, remediation |
| `context/bugs/001/test-report.md` | generated tests, FIRST compliance, coverage gaps |
| `docs/runs/*.txt` | raw per-stage execution logs |

### Grade the verifier itself

`docs/expected-discrepancies.md` is the answer key for the 4 deliberate errors
planted in the research file. Compare it against `verified-research.md`:

- **Recall** — how many of D-1…D-4 were found? *(recorded run: 4/4)*
- **Precision** — were any correct claims wrongly rejected? *(recorded run: 0)*
- **Level** — did the quality level correctly land below the top grade? *(C · UNRELIABLE)*

This file is stored in `docs/`, **not** in `context/`, so that no agent can read it.

---

## 5. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `CLI 'claude' не знайдено в PATH` | Claude Code not installed | install it, or run only `npm start` / `npm test` |
| `Немає обов'язкового файлу: …` | a pipeline input is missing | restore it from git |
| `Не вдалося прочитати GATE із …` | an agent omitted the machine-readable block | re-run that stage; the block format is mandatory |
| `tee: docs/runs/…: No such file or directory` | piping the run through `tee` before the script creates the directory | `mkdir -p docs/runs` first, or drop the pipe — the script already logs each stage |
| `npm test` shows 12 tests instead of 22 | generated test files are absent | run the pipeline, or restore `tests/*.generated.test.js` |
| screenshots missing from a commit | `*.log` is git-ignored repo-wide | save screenshots as **`.png`**, never `.log` |
