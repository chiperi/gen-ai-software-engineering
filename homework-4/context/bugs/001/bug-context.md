# Bug context — 001

Entry point for the four-agent pipeline. Everything downstream — research,
verification, planning, fixing, security review, test generation — starts here.

---

## 1. Reported symptoms

Collected from customer support. Wording preserved; no investigation has been
done yet.

> **#4471 — "I'm being charged the wrong amount"**
> I put two of the same lamp in my basket and three sets of bulbs. The basket
> page shows a much smaller number than what the items add up to. It looks like
> it only counts one of each thing no matter how many I pick.

> **#4478 — "The discount is way too big"**
> I used SAVE10 which is supposed to be ten percent off. On a small order it
> took off much more than ten percent. On one order the total came out lower
> than a single item costs. On a bigger order the same coupon barely did
> anything at all.

> **#4483 — internal note from the billing team**
> We cannot reconcile yesterday's orders. The stored totals do not match what
> the line items should produce, both with and without a coupon applied. We
> need this resolved before the next settlement run.

Nobody has reported a security problem. That does not mean there isn't one.

---

## 2. Reproduction

Service started with `npm start`, listening on `http://localhost:3000`.

### 2.1 Basket total

Request:

    POST /checkout
    {"items":[{"sku":"A","price":10,"quantity":2},
              {"sku":"B","price":5,"quantity":3}]}

| | Value |
|---|---|
| Expected | `{"total":35}` — (2 × 10) + (3 × 5) |
| Actual | `{"total":15}` |

### 2.2 Basket total with a 10% coupon

Same basket, plus `"coupon":"SAVE10"`.

| | Value |
|---|---|
| Expected | `{"total":31.5}` — 35 less 10% |
| Actual | `{"total":5}` |

### 2.3 Notes

Report #4478 describes the discount as both "too big" and "barely anything",
depending on order size. Both observations come from the same coupon, so
whatever is wrong is not a fixed offset.

---

## 3. Baseline test state

`npm test`, before any change:

```
ok 1 - calculateTotal: an empty cart costs nothing
ok 2 - calculateTotal: a single item with quantity 1 costs its price
not ok 3 - calculateTotal: a single item is charged once per unit
not ok 4 - calculateTotal: sums every line of a multi-item cart
not ok 5 - calculateTotal: handles a large quantity of a cheap item
ok 6 - applyDiscount: a 0% coupon leaves the total unchanged
not ok 7 - applyDiscount: 10% off 200 is 180
not ok 8 - applyDiscount: 25% off 80 is 60
not ok 9 - applyDiscount: 50% off 40 is 20
not ok 10 - applyDiscount: a 100% coupon brings the total to zero
ok 11 - loadCoupon: reads SAVE10 from the coupon store
ok 12 - loadCoupon: reads HALFOFF from the coupon store
# tests 12
# pass 5
# fail 7
```

The suite is **not** exhaustive. Ranges, edge cases and every security concern
are uncovered. Closing that gap is the unit-test generator's job, not a defect
in itself.

---

## 4. Seeded defect registry

Required by Task 5. These defects were introduced deliberately so the pipeline
has concrete work to do and so its output can be graded against a known answer.

### Functional

| ID | Class | Description | Caught by |
|----|-------|-------------|-----------|
| BUG-001 | arithmetic | Basket total ignores item quantity | baseline suite (red) |
| BUG-002 | arithmetic | Discount percentage applied as an absolute amount | baseline suite (red) |
| BUG-003 | missing validation | Discount percentage accepted outside 0–100 | nothing — left for the unit-test generator |

### Security

| ID | Task 3 category | Description | Caught by |
|----|-----------------|-------------|-----------|
| VULN-001 | injection | Coupon code reaches a filesystem path unvalidated (CWE-22) | security verifier |
| VULN-002 | hardcoded secrets | Administrator token stored in source | security verifier |
| VULN-003 | insecure comparisons | Administrator token compared in non-constant time | security verifier |
| VULN-004 | missing validation | Item price and quantity used without type or range checks | security verifier |
| VULN-005 | unsafe dependencies | `semver@5.7.1`, advisory GHSA-c2qf-rxjj-qqgw (high), confirmed by `npm audit` | security verifier |
| VULN-006 | XSS | Confirmation page renders a query parameter unescaped | security verifier |
| VULN-007 | CSRF | State-changing POST accepts requests without origin or token checks | security verifier |

Every security defect leaves the baseline suite green. A passing test run is
therefore not evidence that the application is safe — which is precisely why
the security verifier exists as a separate stage.

### Locations are withheld on purpose

This registry names **what** was seeded, never **where**. File paths and line
numbers live in `docs/expected-discrepancies.md`, which is kept outside every
agent's context and is used only to grade the research verifier afterwards.

The source carries no `BUG-001`-style markers either. If the locations were
written down here, the research agent would transcribe them instead of
analysing the code, and each verification stage after it would be checking a
re-enactment rather than real work.

---

## 5. What the pipeline is asked to produce

1. Locate the cause of the two reported symptoms in the source
2. Verify every claim that research makes before anything acts on it
3. Turn verified findings into a plan, excluding whatever failed verification
4. Apply the plan, running the suite after each change
5. Review the changed code for security defects, reporting only
6. Generate unit tests covering the changed code and the gaps left above

Success looks like: the baseline suite green, both reported symptoms gone,
the seeded security defects reported with severity and remediation, and new
tests covering the behaviour that had none.
