# Verified Research — 001: Cart Service Defects

**Agent**: Research Verifier
**Rubric**: `skills/research-quality-measurement.md` v1.0
**Subject**: `context/bugs/001/research/codebase-research.md`
**Sources of truth**: `src/cart.js`, `src/coupons.js`, `src/server.js`, `tests/cart.test.js`, `tests/coupons.test.js`, `data/`, `credentials.json`

---

## 1. Verification Summary

**Вердикт: FAIL** — дослідження містить дві CRITICAL-розбіжності: описано
поведінку (`Math.round`-округлення) і сутність (`src/validators.js`,
`isSafeIdentifier`), яких у проєкті не існує.

**Рівень якості: C — `UNRELIABLE`** (30 з 35 перевірюваних тверджень
підтверджено = 86%, з них 2 CRITICAL → §4 рубрикатора).

**Ворота: `CONDITIONAL`.** Продовження пайплайну дозволене, бо
`context/bugs/001/implementation-plan.md` явно нейтралізує **обидві**
CRITICAL-розбіжності в розділі `Claims excluded after verification`
(рядки 25–26). Якби бодай одну не було згадано — ворота опустилися б до `HALT`.

```
<!-- MACHINE-READABLE VERDICT -->
RESEARCH_QUALITY: C
QUALITY_LABEL: UNRELIABLE
CLAIMS_TOTAL: 35
CLAIMS_VERIFIED: 30
VERIFICATION_RATE: 86%
DISCREPANCIES_CRITICAL: 2
DISCREPANCIES_MAJOR: 1
DISCREPANCIES_MINOR: 1
UNVERIFIABLE: 1
GATE: CONDITIONAL
<!-- END VERDICT -->
```

---

## 2. Verified Claims

Ідентифікатори мають вигляд `R-n.m`, де `R-n` — розділ дослідження,
`m` — окреме перевірюване твердження в ньому.

| ID | Твердження | Посилання (перевірене) | Цитата |
|---|---|---|---|
| R-1.1 | `calculateTotal` проходить позиції в циклі й додає лише ціну одиниці | `src/cart.js:7-9` | ✅ |
| R-1.2 | поле `quantity` у тілі циклу не читається жодного разу | `src/cart.js:1-11` (`grep -rn "quantity" src/` → нічого) | ✅ |
| R-1.5 | для `2×$10` і `3×$5` повертає `15` замість `35` | `src/cart.js:8` + `tests/cart.test.js:5-11` | ✅ |
| R-2.1 | на вході є перевірка типу, що відкидає не-масив | `src/cart.js:2-4` | ✅ |
| R-2.2 | Location `src/cart.js:2` | `src/cart.js:2` | ✅ |
| R-2.3 | цитата блоку `if (!Array.isArray(items)) { throw new TypeError('items must be an array'); }` | `src/cart.js:2-4` | ✅ посимвольно (без відступів) |
| R-2.4 | тест `calculateTotal throws a TypeError when items is not an array` зелений | `tests/cart.test.js:21-23` | ✅ |
| R-3.1 | `applyDiscount` трактує `percent` як суму; ділення на 100 відсутнє | `src/cart.js:13-15` | ✅ |
| R-3.2 | Location `src/cart.js:14` | `src/cart.js:14` | ✅ |
| R-3.3 | цитата `return subtotal - percent;` | `src/cart.js:14` | ✅ посимвольно |
| R-3.4 | для `35`/`10` результат `25` замість `31.5` | `src/cart.js:14` + `tests/cart.test.js:25-27` | ✅ |
| R-5.1 | `applyDiscount` не перевіряє межі `0..100` | `src/cart.js:13-15` | ✅ |
| R-5.2 | Location `src/cart.js:13` | `src/cart.js:13` (сигнатура функції, тіло 13–15) | ✅ |
| R-5.3 | `percent = 150` дає від'ємний підсумок | `src/cart.js:14` (`35 - 150 = -115`) | ✅ |
| R-5.4 | `percent = -5` збільшує ціну | `src/cart.js:14` (`35 - (-5) = 40`) | ✅ |
| R-5.5 | жодного винятку не кидається | `src/cart.js:13-15` | ✅ |
| R-5.6 | тест `applyDiscount rejects an out-of-range percent` падає | `tests/cart.test.js:37-40` | ✅ |
| R-7.1 | `loadCoupon` склеює `code` з каталогом і одразу читає з диска | `src/coupons.js:8-9` | ✅ |
| R-7.2 | Location `src/coupons.js:8` | `src/coupons.js:8` | ✅ |
| R-7.3 | цитата ``const file = path.join(DATA_DIR, `${code}.json`);`` | `src/coupons.js:8` | ✅ посимвольно |
| R-7.4 | `path.join` нормалізує `..`, тому `../credentials` виводить за межі `data/` | `src/coupons.js:5,8` + `data/SAVE10.json`, `credentials.json` у корені | ✅ |
| R-7.5 | перевірки належності підсумкового шляху до `DATA_DIR` немає | `src/coupons.js:7-10` | ✅ |
| R-8.1 | Location `src/coupons.js:5` + цитата `const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');` | `src/coupons.js:5` | ✅ посимвольно |
| R-8.2 | каталог даних визначено коректно | `src/coupons.js:5` → `data/` існує, містить `SAVE10.json` | ✅ |
| R-9.1 | HTTP-обробник передає параметр запиту у `loadCoupon` без обробки | `src/server.js:31,33` | ✅ |
| R-9.2 | Location `src/server.js:31` | `src/server.js:31` | ✅ |
| R-9.3 | цитата `const code = url.searchParams.get('code');` | `src/server.js:31` | ✅ посимвольно |
| R-10.1 | `npm test` дає 12 тестів | `tests/cart.test.js` — 8 `test(`, `tests/coupons.test.js` — 4 `test(` | ✅ |
| R-10.2 | 5 проходять, 7 падають | розрахунок нижче | ✅ |
| R-10.3 | червоні тести описують цільову поведінку | `tests/cart.test.js:10,26,34,38-39`, `tests/coupons.test.js:10-11,15-16,20-21` | ✅ |

**Разом підтверджено: 30.**

### Обґрунтування R-10.2 (5 pass / 7 fail)

`npm test` у цьому запуску виконати не вдалося (команда потребує окремого
дозволу середовища), тому базлайн виведено статично, поіменно з джерел —
функції чисті й детерміновані, єдина файлова залежність перевірена (`data/SAVE10.json`
існує з тілом `{ "code": "SAVE10", "percent": 10 }`; `credentials.json` існує в корені репозиторію).

| Тест | Джерело | Результат за поточним кодом |
|---|---|---|
| `calculateTotal multiplies price by quantity` | cart.test.js:5 | ❌ `15 ≠ 35` |
| `calculateTotal returns 0 for an empty cart` | cart.test.js:13 | ✅ |
| `calculateTotal treats a single unit as price * 1` | cart.test.js:17 | ✅ |
| `calculateTotal throws a TypeError…` | cart.test.js:21 | ✅ |
| `applyDiscount applies a 10% discount correctly` | cart.test.js:25 | ❌ `25 ≠ 31.5` |
| `applyDiscount with 0% leaves the subtotal unchanged` | cart.test.js:29 | ✅ |
| `applyDiscount with 100% yields 0` | cart.test.js:33 | ❌ `-65 ≠ 0` |
| `applyDiscount rejects an out-of-range percent` | cart.test.js:37 | ❌ виняток не кидається |
| `loadCoupon reads a valid coupon by code` | coupons.test.js:5 | ✅ |
| `loadCoupon rejects parent-directory traversal` | coupons.test.js:9 | ❌ читає `credentials.json`, не кидає |
| `loadCoupon rejects codes containing separators or dots` | coupons.test.js:14 | ❌ `ENOENT` не збігається з `/invalid coupon code/` |
| `loadCoupon rejects non-string input` | coupons.test.js:19 | ❌ `ENOENT` не збігається з `/invalid coupon code/` |

**5 pass, 7 fail — збігається з твердженням.**

---

## 3. Discrepancies Found

### D-1 · R-4 · `CRITICAL` — округлення до двох знаків не існує

- **Стверджувалось**: «Після обчислення знижки функція нормалізує результат до
  копійок» із цитатою `return Math.round(result * 100) / 100;`
- **Насправді**: у `src/cart.js` немає ні `Math.round`, ні `toFixed`, ні будь-якої
  іншої нормалізації. Уся функція `applyDiscount` — три рядки.
- **Доказ** (дослівно, `src/cart.js:13-15`):
  ```js
  export function applyDiscount(subtotal, percent) {
      return subtotal - percent;
  }
  ```
  `grep -rn "Math.round\|toFixed" src/ tests/` → жодного збігу.
- **Клас**: `CRITICAL` за §2 — описано код, якого немає в джерелі. Додатково
  спрацьовує окреме правило §2: у R-4 **немає поля `Location`**, при цьому
  твердження описує конкретну поведінку коду.
- **Вплив**: рекомендація «зберегти округлення під час виправлення» змусила б
  виконавця **додати** неіснуючу поведінку. Це змінює числові очікування:
  наявні тести (`applyDiscount(35, 10) === 31.5`) округлення не вимагають, а
  зайвий `Math.round` створює розбіжність із тестами на інших входах.

### D-2 · R-6 · `CRITICAL` — модуль `src/validators.js` і `isSafeIdentifier` не існують

- **Стверджувалось**: «У проєкті вже є модуль з допоміжними перевірками вхідних
  значень», Location `src/validators.js:12`, цитата
  `export function isSafeIdentifier(value) { ... }`
- **Насправді**: файлу немає; ідентифікатор ніде не зустрічається.
- **Доказ** (дослівний вивід):
  ```
  $ ls src/validators.js
  ls: src/validators.js: No such file or directory

  $ grep -rn "isSafeIdentifier" src/ tests/
  (порожньо)
  ```
  Каталог `src/` містить рівно три файли: `cart.js`, `coupons.js`, `server.js`.
- **Клас**: `CRITICAL` за §8 крок 1 — файл не існує, далі не йдемо.
- **Вплив**: план послався б на неіснуючий API; виконавець отримав би
  `ERR_MODULE_NOT_FOUND` при імпорті. Валідацію коду купона треба писати
  локально.

### D-3 · R-1.4 · `MAJOR` — цитата не збігається з джерелом

- **Стверджувалось**: `total = total + item.price;`
- **Насправді**: `total += item.price;`
- **Доказ** (`grep -n "total" src/cart.js`):
  ```
  8:        total += item.price;
  ```
- **Клас**: `MAJOR` за §2 — сутність існує, сенс той самий, але цитата
  текстуально інша. §8 крок 3 вимагає порівнювати посимвольно.
- **Вплив**: план у форматі before/after із хибним «before» не знайде рядка для
  заміни; потрібна ручна звірка перед правкою.

### D-4 · R-1.3 · `MINOR` — зсув номера рядка на 1

- **Стверджувалось**: Location `src/cart.js:9`
- **Насправді**: накопичення суми — рядок `8`; рядок `9` — закривальна дужка `}`.
- **Доказ** (`src/cart.js:6-10`):
  ```
   6:    let total = 0;
   7:    for (const item of items) {
   8:        total += item.price;
   9:    }
  10:    return total;
  ```
- **Клас**: `MINOR` за §8 крок 2 — зсув у межах ±3 рядків.
- **Вплив**: змісту правки не змінює. Зауважу, що `bug-context.md:24` вказує
  правильний рядок `src/cart.js:8`.

---

## 4. Unverifiable

| ID | Твердження | Чому не перевірено |
|---|---|---|
| R-5.7 | тест падає саме з текстом `Missing expected exception (RangeError)` | потребує запуску `npm test`; у цьому середовищі команда не була дозволена. Факт падіння тесту підтверджено статично (R-5.6) — непідтвердженим лишається лише дослівний рядок повідомлення `node:assert`. |

Згідно з §3 рубрикатора це **не** розбіжність і в знаменник не входить.

---

## 5. Research Quality Assessment

**Арифметика:**

```
CLAIMS_TOTAL      = 35   (перевірювані твердження; рекомендації розділу
                          «Recommended direction» і оцінки в знаменник не входять)
CLAIMS_VERIFIED   = 30
CLAIMS_FAILED     = 5    (R-1.3, R-1.4, R-4.1, R-6.1, R-6.2)
VERIFICATION_RATE = 30 / 35 = 0.857 = 86%

DISCREPANCIES_CRITICAL = 2   (D-1 охоплює R-4.1; D-2 охоплює R-6.1 + R-6.2)
DISCREPANCIES_MAJOR    = 1   (D-3)
DISCREPANCIES_MINOR    = 1   (D-4)
UNVERIFIABLE           = 1   (R-5.7, поза знаменником)
```

**Підстановка в таблицю §4:**

| Рівень | Умова | Виконано? |
|---|---|---|
| A | `RATE = 100%` **і** 0 розбіжностей | ❌ 86%, 4 розбіжності |
| B | `RATE ≥ 85%` **і** `CRITICAL = 0` | ❌ рейт проходить (86% ≥ 85%), але `CRITICAL = 2 ≠ 0` |
| C | `RATE ≥ 60%` **і** `CRITICAL ≤ 2` | ✅ 86% ≥ 60% **і** 2 ≤ 2 |
| D | інакше | — |

**Рівень визначається найгіршою умовою, що спрацювала → `C` (`UNRELIABLE`).**
Саме той випадок, який рубрикатор описує явно: високий рейт не рятує від
CRITICAL-розбіжності.

**Ворота (§5):** `C → CONDITIONAL`. Перевірка
`context/bugs/001/implementation-plan.md`, розділ
`Claims excluded after verification` (рядки 18–30):

| CRITICAL | Нейтралізовано в плані? |
|---|---|
| D-1 (R-4, `Math.round`) | ✅ рядок 25: «у `src/cart.js` немає ні `Math.round`, ні будь-якого округлення… Округлення **не додавати**». Продубльовано в Change 2, «Do not change» (рядок 88) |
| D-2 (R-6, `src/validators.js`) | ✅ рядок 26: «файл `src/validators.js` у проєкті відсутній. Валідацію писати локально в `src/coupons.js`» |

Обидві згадані → ворота лишаються `CONDITIONAL`, до `HALT` не опускаються.
Додатково план самостійно виправляє D-3 і D-4 (рядки 28–30), хоча для воріт
це не є обов'язковим.

**Профіль помилок дослідження.** Обидві CRITICAL-розбіжності — не неточності,
а домислені сутності: код, який «мав би бути» в грошових розрахунках
(`Math.round`), і helper-модуль, який «зазвичай є» у проєктах
(`validators.js`). Обидві виглядають професійно й обидві не мають підтвердження
в джерелі; R-4 до того ж єдиний розділ без поля `Location`. Усе, що
стосується реально прочитаних файлів (`cart.js`, `coupons.js`, `server.js`),
підтверджено — крім однієї цитати, переписаної «за сенсом».

---

## 6. References

Перевірені файли та рядки:

| Файл | Рядки | Що перевірялось |
|---|---|---|
| `src/cart.js` | 1–15 (весь файл) | R-1.1, R-1.2, R-1.3, R-1.4, R-1.5, R-2.1–R-2.3, R-3.1–R-3.4, R-4.1, R-5.1–R-5.5 |
| `src/coupons.js` | 1–10 (весь файл) | R-7.1–R-7.5, R-8.1, R-8.2 |
| `src/server.js` | 27–48, зокрема 31, 33, 43 | R-9.1–R-9.3 |
| `tests/cart.test.js` | 1–40 (8 тестів) | R-2.4, R-3.4, R-5.6, R-10.1–R-10.3 |
| `tests/coupons.test.js` | 1–23 (4 тести) | R-10.1–R-10.3 |
| `data/SAVE10.json` | 1 | R-8.2, базлайн тесту `loadCoupon reads a valid coupon by code` |
| `credentials.json` (корінь репозиторію) | існування | R-7.4 |
| `src/validators.js` | — | **не існує** (D-2) |
| `context/bugs/001/bug-context.md` | 1–75 | контекст задачі; звірка координат BUG-001 |
| `context/bugs/001/implementation-plan.md` | 18–30, 88, 126 | перевірка воріт `CONDITIONAL` |

Використані команди перевірки:

```
ls src/validators.js
grep -rn "isSafeIdentifier" src/ tests/
grep -rn "Math.round\|toFixed" src/ tests/
grep -rn "quantity" src/
grep -n "total\|price\|percent\|subtotal" src/cart.js
grep -n "DATA_DIR\|path.join\|code" src/coupons.js
grep -n "searchParams" src/server.js
grep -c "^test(" tests/cart.test.js tests/coupons.test.js
```
