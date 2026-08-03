# Fix Summary — 001: Cart Service Defects

**Agent**: Bug Fixer
**Plan**: `context/bugs/001/implementation-plan.md`
**Gate at entry**: `CONDITIONAL` (з `verified-research.md`) — обидві CRITICAL-розбіжності
(D-1 `Math.round`, D-2 `src/validators.js`/`isSafeIdentifier`) покриті розділом
`Claims excluded after verification` плану (рядки 25–26). Продовження дозволене.

---

## Changes Made

### Change 1 — BUG-001: врахувати кількість позиції

- **File**: `src/cart.js:8` (тіло циклу в `calculateTotal`)
- **Before**:
  ```js
      let total = 0;
      for (const item of items) {
          total += item.price;
      }
      return total;
  ```
- **After**:
  ```js
      let total = 0;
      for (const item of items) {
          total += item.price * item.quantity;
      }
      return total;
  ```
- **Тести після цієї зміни**: 6 pass / 6 fail (було 5/7)
- **Змінили статус**: `calculateTotal multiplies price by quantity for each line` — fail → pass

### Change 2 — BUG-002: формула знижки та валідація діапазону

- **File**: `src/cart.js:13-18` (уся функція `applyDiscount`)
- **Before**:
  ```js
  export function applyDiscount(subtotal, percent) {
      return subtotal - percent;
  }
  ```
- **After**:
  ```js
  export function applyDiscount(subtotal, percent) {
      if (typeof percent !== 'number' || Number.isNaN(percent) || percent < 0 || percent > 100) {
          throw new RangeError('percent must be between 0 and 100');
      }
      return subtotal * (1 - percent / 100);
  }
  ```
- **Тести після цієї зміни**: 9 pass / 3 fail (було 6/6)
- **Змінили статус**:
  - `applyDiscount applies a 10% discount correctly` — fail → pass
  - `applyDiscount with 100% yields 0` — fail → pass
  - `applyDiscount rejects an out-of-range percent` — fail → pass

### Change 3 — VULN-001: валідація коду купона перед побудовою шляху

- **File**: `src/coupons.js:7-15` (уся функція `loadCoupon` + новий модульний константа)
- **Before**:
  ```js
  export function loadCoupon(code) {
    const file = path.join(DATA_DIR, `${code}.json`);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  ```
- **After**:
  ```js
  const COUPON_CODE = /^[A-Z0-9]{3,16}$/;

  export function loadCoupon(code) {
    if (typeof code !== 'string' || !COUPON_CODE.test(code)) {
      throw new Error('invalid coupon code');
    }
    const file = path.join(DATA_DIR, `${code}.json`);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  ```
- **Тести після цієї зміни**: 12 pass / 0 fail (було 9/3)
- **Змінили статус**:
  - `loadCoupon rejects parent-directory traversal` — fail → pass
  - `loadCoupon rejects codes containing separators or dots` — fail → pass
  - `loadCoupon rejects non-string input` — fail → pass

---

## Overall Status

**SUCCESS** — тести: 5 pass / 7 fail → 12 pass / 0 fail.

Збігається з `Expected end state` плану: `npm test` → 12 тестів, 12 pass, 0 fail.

---

## Manual Verification

```bash
npm test 2>&1 | tail -10
```
Очікуваний вивід (фрагмент):
```
1..12
# tests 12
# suites 0
# pass 12
# fail 0
```

```bash
npm start &
sleep 1
curl -s -X POST localhost:3000/checkout -H 'content-type: application/json' \
  -d '{"items":[{"price":10,"quantity":2},{"price":5,"quantity":3}]}'
```
Очікується: `{"total":35}`

```bash
curl -s -X POST localhost:3000/checkout -H 'content-type: application/json' \
  -d '{"items":[{"price":10,"quantity":2},{"price":5,"quantity":3}],"couponCode":"SAVE10"}'
```
Очікується: `{"total":31.5}`

```bash
curl -s "localhost:3000/coupon?code=SAVE10"
```
Очікується: `{"code":"SAVE10","percent":10}`

```bash
curl -s -o /dev/null -w '%{http_code}\n' "localhost:3000/coupon?code=../credentials"
```
Очікується: `400`

```bash
curl -s "localhost:3000/coupon?code=../credentials"
```
Очікується: `{"error":"invalid coupon code"}` (не вміст `credentials.json`)

```bash
kill %1
```

---

## Deviations

Немає. Усі три зміни застосовано рівно так, як описано в `implementation-plan.md`,
без відхилень. Пункти з `Claims excluded after verification` (округлення
`Math.round`, `src/validators.js`/`isSafeIdentifier`) не реалізовувались.

---

## Files Changed

```
src/cart.js
src/coupons.js
```

---

## References

- План: `context/bugs/001/implementation-plan.md`
- Верифіковане дослідження: `context/bugs/001/research/verified-research.md`
- Контекст дефектів: `context/bugs/001/bug-context.md`

---

<!-- MACHINE-READABLE VERDICT -->
CHANGES_PLANNED: 3
CHANGES_APPLIED: 3
TESTS_BEFORE_PASS: 5
TESTS_BEFORE_FAIL: 7
TESTS_AFTER_PASS: 12
TESTS_AFTER_FAIL: 0
FILES_CHANGED: src/cart.js,src/coupons.js
OVERALL_STATUS: SUCCESS
GATE: PASS
<!-- END VERDICT -->
