# Skill — Research quality measurement

Defines how the quality of a codebase research document is measured and how
that measurement becomes a decision. Used by `research-verifier` when writing
`verified-research.md`.

The point of the measurement is not to describe research. It is to decide
whether anything downstream is allowed to act on it.

---

## 1. Unit of measurement

A **claim** is one assertion carrying one `file:line` reference.

Compound sentences split. *"`applyDiscount` at cart.js:20 subtracts the value
and never checks its range"* is **two** claims: each can be confirmed or
refuted on its own.

The research document numbers its own claims. That numbered list is the
denominator, and it is fixed before verification begins.

> **Do not renumber, merge or drop claims.** Changing the denominator changes
> the score. The verifier measures; it does not decide what counts.

---

## 2. Three outcomes per claim

| Outcome | Condition |
|---------|-----------|
| **VERIFIED** | the file exists, the line exists, and the quoted snippet matches the source at that location (ignoring leading whitespace) |
| **DISCREPANCY** | anything about the reference or the snippet fails to match |
| **UNVERIFIABLE** | the claim cannot be checked against source at all — runtime behaviour, author intent, an external system |

Both checks are required. A reference can point at a real line and still quote
it wrongly; that is a discrepancy, not a pass.

**UNVERIFIABLE counts against the research**, never for it. A claim that cannot
be checked is not a basis for changing code.

---

## 3. Discrepancy classes

Severity follows the **damage the claim would do if acted upon**, not how
wrong it looks.

| Class | What it is | Consequence if it survives |
|-------|------------|----------------------------|
| **CRITICAL** | **Fabrication** — asserts code that does not exist anywhere: an invented function, import, file or identifier | The fixer implements something nobody asked for. Code is born from a hallucination |
| **HIGH** | **Distorted quote** — the snippet exists but is altered in a way that changes its meaning | The plan is built on a wrong understanding; the fix addresses the wrong thing |
| **MEDIUM** | **Wrong location** — the code exists, the reference points elsewhere | Time is wasted looking in the wrong place; the code itself is not endangered |
| **LOW** | **Cosmetic** — formatting, whitespace, a name spelled differently in prose | No functional consequence |

A one-character difference in a quote can be HIGH. A twenty-line offset is
still only MEDIUM. Severity is about consequence, not about magnitude.

---

## 4. Quality levels

| Level | Label | What the plan may do with the research |
|-------|-------|----------------------------------------|
| **A** | RELIABLE | use it as it stands |
| **B** | MOSTLY RELIABLE | use it except for the flagged claims |
| **C** | UNRELIABLE | use it only if every CRITICAL and HIGH claim is listed under plan exclusions |
| **D** | UNUSABLE | nothing — stop |

How the level is computed is section 5. There is exactly one procedure; do not
infer a level from these descriptions.

**C versus D.** At C the research lies in places, but the lies are localised —
strike them out and what remains is usable. At D the document cannot be
reconciled with the codebase, so there is nothing left to strike out from.

---

## 5. The dominance rule

> **The level is the worse of two bands: the coverage band and the severity
> band.**

**Coverage band** — `VERIFIED %` = VERIFIED ÷ total claims. UNVERIFIABLE sits
in the denominator only.

| Coverage | Band |
|----------|------|
| VERIFIED ≥ 95% | A |
| VERIFIED ≥ 85% | B |
| VERIFIED < 85% | C |
| UNVERIFIABLE > 30%, or the references cannot be mapped to this codebase | D |

**Severity band**

| Findings | Band |
|----------|------|
| 0 CRITICAL, 0 HIGH | A |
| 0 CRITICAL, 1 HIGH | B |
| ≥ 1 CRITICAL, or ≥ 2 HIGH | C |

A single CRITICAL therefore caps the level at **C**, even at 99% verified.

This is not severity for its own sake. Percentage measures **volume**;
severity measures **risk**. Averaging them hides the case the whole exercise
exists to catch:

| | Research X | Research Y |
|---|---|---|
| Verified | 97% | 80% |
| Discrepancies | 1 × CRITICAL (invented import) | 7 × MEDIUM (line offsets) |
| Band by percentage | A | C |
| Band by severity | C | B |
| **Level** | **C** | **C** |

Y looks worse and costs time. X costs code. An average would have rated X as
excellent research.

Both intermediate bands must be stated in the report, together with the reason
the worse one was taken. A level presented without them reads as an opinion
rather than the result of applying a rule.

---

## 6. Gate

| Level | VERDICT | Effect |
|-------|---------|--------|
| A | `PASS` | continue |
| B | `PASS` | continue; flagged claims go to plan exclusions |
| C | `CONDITIONAL` | continue **only if** the planner excludes every CRITICAL and HIGH claim, and the counts match |
| D | `FAIL` | stop; nothing downstream runs |

---

## 7. Uncertainty

> **If a claim cannot be decided, record it as a DISCREPANCY, not as VERIFIED.**

The two mistakes available here do not cost the same:

| Mistake | Cost |
|---------|------|
| Flagging a true claim | one unnecessary exclusion; visible, cheap, recoverable |
| Passing a false claim | it reaches the code. **Silent.** Nobody finds out |

When two classes are equally defensible for the same discrepancy, take the
more severe one and say why.

---

## 8. Required output

`verified-research.md` must contain these sections, in this order:

1. **Verification Summary** — pass/fail, level and label, `VERIFIED/total`,
   UNVERIFIABLE count, count per discrepancy class
2. **Verified Claims** — each claim with its confirmed `file:line`
3. **Discrepancies Found** — for each: claim number, class, what was claimed,
   what the source actually contains, and what the planner must therefore do
4. **Research Quality Assessment** — both intermediate bands, the dominance
   rule applied, the resulting level with reasoning
5. **References** — every `file:line` checked

Section 3 is what the planner consumes. Each entry must name the action —
exclude, correct, proceed — not merely observe that something is off.

Close the file with:

```
=== STAGE RESULT ===
STAGE:    research-verification
VERDICT:  PASS | CONDITIONAL | FAIL
QUALITY:  A | B | C | D
CLAIMS:   <verified>/<total>
UNVERIFIABLE: <count>
CRITICAL: <count>
HIGH:     <count>
MEDIUM:   <count>
LOW:      <count>
=== END STAGE RESULT ===
```

The orchestrator reads this block. Field names and spelling are part of the
contract.

---

## 9. Worked example

35 claims. 30 VERIFIED, 2 UNVERIFIABLE, 3 discrepancies: 2 CRITICAL, 1 MEDIUM.

| Step | Result |
|------|--------|
| Coverage | 30 ÷ 35 = 86% → ≥ 85%, below 95% → band **B** |
| Unverifiable | 2 ÷ 35 = 6% → below 30%, so not D |
| Severity | 2 CRITICAL → band **C** |
| Dominance | worse of B and C → **C · UNRELIABLE** |
| Gate | `CONDITIONAL` |

The planner must now exclude both CRITICAL claims, and the orchestrator will
check that exactly 2 exclusions appear before letting the run continue.
