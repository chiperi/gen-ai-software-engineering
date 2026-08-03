# Test Report — 001: Cart Service Defects

**Agent**: Unit Test Generator
**Skill**: `skills/unit-tests-FIRST.md`
**Inputs**: `context/bugs/001/fix-summary.md`, `context/bugs/001/implementation-plan.md`, `tests/`

---

## 1. Scope

`FILES_CHANGED` з `fix-summary.md`: `src/cart.js`, `src/coupons.js`.

Покриті функції (усі зміни з `fix-summary.md`):

- `calculateTotal` — `src/cart.js` (BUG-001)
- `applyDiscount` — `src/cart.js` (BUG-002)
- `loadCoupon` — `src/coupons.js` (VULN-001)

Поза обсягом свідомо: `src/server.js`, `src/coupons.js` (частина `DATA_DIR`, не
змінена), будь-який код поза `FILES_CHANGED` — жодних правок там не було, тому
за правилом Timely (skill, розділ T) тести для них не пишуться.

Наявний базовий набір (`tests/cart.test.js`, `tests/coupons.test.js`, 12
тестів) вже покриває категорію **«штатний випадок»** для всіх трьох функцій
(`calculateTotal` з quantity>1, `applyDiscount` з 10%, `loadCoupon('SAVE10')`)
і частково категорію **«некоректний вхід»** (не-масив, поза діапазоном,
не-рядок, роздільники/крапки). Ці випадки в `*.generated.test.js` не
повторюються — нижче додано лише те, чого бракувало.

---

## 2. Generated Tests

| Файл | Тест | Категорія | Дефект |
|---|---|---|---|
| `tests/cart.generated.test.js` | `calculateTotal treats a quantity of 0 as contributing nothing to the total` | межа (quantity = 0) | BUG-001 |
| `tests/cart.generated.test.js` | `calculateTotal (BUG-001 regression) honours quantity greater than one` | регресія | BUG-001 |
| `tests/cart.generated.test.js` | `applyDiscount rejects a non-numeric percent` | некоректний вхід (тип: string, NaN) | BUG-002 |
| `tests/cart.generated.test.js` | `applyDiscount returns 0 when subtotal is 0` | межа (subtotal = 0) | BUG-002 |
| `tests/cart.generated.test.js` | `applyDiscount (BUG-002 regression) multiplies the percent instead of subtracting it` | регресія | BUG-002 |
| `tests/coupons.generated.test.js` | `loadCoupon rejects codes shorter than the minimum length` | межа (довжина < 3) | VULN-001 |
| `tests/coupons.generated.test.js` | `loadCoupon rejects codes longer than the maximum length` | межа (довжина > 16) | VULN-001 |
| `tests/coupons.generated.test.js` | `loadCoupon rejects an empty string` | межа (порожньо) | VULN-001 |
| `tests/coupons.generated.test.js` | `loadCoupon rejects lowercase letters` | некоректний вхід (значення поза допустимим набором) | VULN-001 |
| `tests/coupons.generated.test.js` | `loadCoupon (VULN-001 regression) rejects an alternate-encoding traversal payload` | регресія | VULN-001 |

**Уже покрито базовим набором (не дублювалось)**:

- `calculateTotal` — штатний випадок (`multiplies price by quantity`), межа
  `quantity === 1` та порожній кошик, некоректний вхід (не-масив) — усе в
  `tests/cart.test.js`.
- `applyDiscount` — штатний випадок (10%), межі `0%`/`100%`, некоректний вхід
  за діапазоном (`150`, `-5`) — усе в `tests/cart.test.js`.
- `loadCoupon` — штатний випадок (`SAVE10`), некоректний вхід (роздільники
  `a/b`, крапки `save.10`, не-рядок `null`/`42`), а також дублюючий сценарій
  обходу каталогу (`../credentials`, `../../../../etc/passwd`) — усе в
  `tests/coupons.test.js`.

Регресійні тести (категорія 4) додано попри те, що базовий набір неявно вже
фіксує виправлену поведінку — базові тести не мають ідентифікатора дефекту в
назві, тому не задовольняють вимогу skill (§ «Що покривати», п. 4) явно.
Дані в регресійних тестах навмисно відрізняються від базових, щоб не бути
буквальним дублем.

---

## 3. Test Run Results

Команда:
```bash
npm test
```

**До генерації** (базовий набір, за `fix-summary.md`): 12 тестів, 12 pass, 0 fail.

**Після генерації**:
```
1..22
# tests 22
# suites 0
# pass 22
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 46.584292
```

22 = 12 (базові) + 10 (згенеровані). Усі зелені.

Повторний запуск (`npm test` двічі поспіль) дав ідентичний результат —
підтверджує Repeatable.

---

## 4. FIRST Compliance

| Властивість | Як забезпечено | Чим підтверджено |
|---|---|---|
| **F — Fast** | Лише виклики функцій у пам'яті; жодного I/O, мережі, `setTimeout` | Найповільніший тест у прогоні — `0.602 мс`, весь набір — `46.58 мс`. Поріг 50 мс на тест не перевищено жодним тестом |
| **I — Independent** | Кожен тест створює власні дані (`items`, `code`) локально, спільного стану між тестами немає | `node --test --test-name-pattern="BUG-001 regression"` — тест виконався й пройшов сам по собі |
| **R — Repeatable** | Без `Date.now()`, `Math.random()`, змінних середовища, порядку файлів | Два послідовні запуски `npm test` дали однаковий результат: 22/22 |
| **S — Self-validating** | Кожен тест закінчується `assert.equal`/`assert.throws` із конкретним значенням або типом/повідомленням помилки; жодного `console.log` | Ручний перегляд усіх 10 нових тестів — у кожному є хоча б один `assert` з конкретним очікуванням |
| **T — Timely** | Тести написані лише для функцій зі списку `FILES_CHANGED` (`calculateTotal`, `applyDiscount`, `loadCoupon`); жоден тест не торкається `src/server.js` чи іншого коду поза fix-summary | Порівняння переліку покритих функцій (розділ 1) зі списком `FILES_CHANGED` у `fix-summary.md` |

**Порушення**: немає (`FIRST_VIOLATIONS: 0`).

---

## 5. Coverage Gaps

- `applyDiscount` не тестується з `Infinity`/`-Infinity` — теоретично проходить
  перевірку `typeof === 'number'`, і результат (`-Infinity`) технічно коректний
  за формулою, тому це не дефект, а прийнятна поведінка поза явним обсягом
  плану (план фіксує лише межі `0..100`).
- `loadCoupon` не тестується на файл, який існує, але містить невалідний JSON
  (`JSON.parse` кине `SyntaxError`) — це не входить до жодного з трьох
  дефектів `bug-context.md` (BUG-001/BUG-002/VULN-001), тому поза обсягом.
- Регресійний тест VULN-001 не відтворює буквально рядок `../credentials`
  з `bug-context.md` (Evidence), бо цей конкретний вхід уже покритий базовим
  тестом `loadCoupon rejects parent-directory traversal` — дублювання
  заборонене інструкцією ролі. Замість цього використано інший вектор обходу
  (зворотні слеші, подвійне кодування), що перевіряє той самий захист
  (allow-list регулярного виразу) на іншому вході.

---

## 6. References

- `context/bugs/001/fix-summary.md`
- `context/bugs/001/implementation-plan.md`
- `context/bugs/001/bug-context.md`
- Покриті файли: `src/cart.js`, `src/coupons.js`
- Нові тести: `tests/cart.generated.test.js`, `tests/coupons.generated.test.js`

---

<!-- MACHINE-READABLE VERDICT -->
TESTS_GENERATED: 10
TESTS_TOTAL: 22
TESTS_PASSED: 22
TESTS_FAILED: 0
FIRST_VIOLATIONS: 0
SLOWEST_TEST_MS: 0.602208
GATE: PASS
<!-- END VERDICT -->
