# Implementation Plan — 001: Cart Service Defects

**Agent**: Bug Planner
**Inputs**: `context/bugs/001/research/verified-research.md`, `context/bugs/001/bug-context.md`
**Executor**: Bug Fixer (`agents/bug-fixer.agent.md`)
**Test command**: `npm test`

---

## Provenance

Цей план побудовано **на верифікованому дослідженні**, а не на сирому виводі
Bug Researcher. Твердження, які Research Verifier позначив як непідтверджені,
до плану не потрапили — див. розділ «Claims excluded after verification».

---

## Claims excluded after verification

Ці пункти сирого дослідження **навмисно не виконуються**. Bug Fixer не
повинен реалізовувати нічого з переліченого нижче.

| Пункт дослідження | Чому виключено |
|---|---|
| R-4 — «результат знижки округлюється до 2 знаків через `Math.round`» | у `src/cart.js` немає ні `Math.round`, ні будь-якого округлення. Твердження не підтверджене джерелом. Округлення **не додавати** |
| R-6 — «перевикористати `isSafeIdentifier` із `src/validators.js:12`» | файл `src/validators.js` у проєкті відсутній. Валідацію писати локально в `src/coupons.js` |

Крім того, скориговано координати R-1: фактичний рядок — `src/cart.js:8`
(в дослідженні вказано `:9`), а фактичний текст — `total += item.price;`
(в дослідженні наведено `total = total + item.price;`).

---

## Change 1 — BUG-001: врахувати кількість позиції

**File**: `src/cart.js`
**Location**: рядок 8, тіло циклу в `calculateTotal`

**Before**
```js
    let total = 0;
    for (const item of items) {
        total += item.price;
    }
    return total;
```

**After**
```js
    let total = 0;
    for (const item of items) {
        total += item.price * item.quantity;
    }
    return total;
```

**Rationale**: внесок позиції має дорівнювати `price * quantity`.
**Do not change**: перевірку `Array.isArray` на рядках 2–4 — вона коректна.
**Verify**: `calculateTotal multiplies price by quantity for each line` стає зеленим;
три інші тести `calculateTotal` лишаються зеленими.

---

## Change 2 — BUG-002: формула знижки та валідація діапазону

**File**: `src/cart.js`
**Location**: рядки 13–15, уся функція `applyDiscount`

**Before**
```js
export function applyDiscount(subtotal, percent) {
    return subtotal - percent;
}
```

**After**
```js
export function applyDiscount(subtotal, percent) {
    if (typeof percent !== 'number' || Number.isNaN(percent) || percent < 0 || percent > 100) {
        throw new RangeError('percent must be between 0 and 100');
    }
    return subtotal * (1 - percent / 100);
}
```

**Rationale**: `percent` — частка, а не сума в доларах. Значення поза `0..100`
не мають сенсу для знижки й повинні відхилятися явно.
**Do not change**: округлення **не додавати** — у вихідному коді його немає
(див. виключений пункт R-4).
**Verify**: `applyDiscount(35, 10) === 31.5`, `applyDiscount(35, 0) === 35`,
`applyDiscount(35, 100) === 0`, `applyDiscount(35, 150)` і `applyDiscount(35, -5)`
кидають `RangeError`.

---

## Change 3 — VULN-001: валідація коду купона перед побудовою шляху

**File**: `src/coupons.js`
**Location**: рядки 7–10, уся функція `loadCoupon`

**Before**
```js
export function loadCoupon(code) {
  const file = path.join(DATA_DIR, `${code}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
```

**After**
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

**Rationale**: список **дозволених** символів, а не заборонених. Блокування
підрядка `..` обходиться кодуванням і різними роздільниками шляху; шаблон,
що допускає лише `A–Z` і `0–9`, робить вихід за межі каталогу неможливим за
побудовою.
**Do not change**: обчислення `DATA_DIR` на рядку 5 — воно коректне.
**Do not change**: текст помилки має бути саме `invalid coupon code` —
на нього спираються наявні тести.
**Verify**: `loadCoupon('SAVE10')` повертає `{ code: 'SAVE10', percent: 10 }`;
`'../credentials'`, `'../../../../etc/passwd'`, `'a/b'`, `'save.10'`, `null`, `42`
кидають помилку `invalid coupon code`.

---

## Execution order

1. Change 1 → `npm test`
2. Change 2 → `npm test`
3. Change 3 → `npm test`

Після кожної зміни тести запускаються окремо, щоб результат можна було
пов'язати з конкретною правкою. Якщо будь-який запуск падає — зафіксувати
вивід у `fix-summary.md` і **зупинитися**, не переходячи до наступної зміни.

## Expected end state

- `npm test` → **12 тестів, 12 pass, 0 fail**
- `GET /coupon?code=SAVE10` → `{"code":"SAVE10","percent":10}`
- `GET /coupon?code=../credentials` → `400` з тілом `{"error":"invalid coupon code"}`
- `POST /checkout` для `2×$10 + 3×$5` → `{"total":35}`
- те саме з купоном `SAVE10` → `{"total":31.5}`

## Constraints

- Не змінювати файли в `tests/` — вони є оракулом коректності
- Не додавати залежностей
- Не видаляти `credentials.json` — потрібен для демонстрації «до/після»
- Не чіпати файли, не перелічені в цьому плані
