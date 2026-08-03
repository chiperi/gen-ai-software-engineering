# Bug Context — 001: Cart Service Defects

## Summary
Мінімальний сервіс кошика на Node.js (HTTP + дві чисті функції розрахунку +
завантажувач купонів із диска). У код навмисно засіяно три дефекти: два
логічні помилки розрахунку та одну вразливість обходу каталогу. Цей документ
є вхідним контекстом для чотириагентного пайплайну.

## Environment
- Node.js 22, без зовнішніх залежностей
- Запуск сервісу: `npm start` (порт 3000, змінюється через `PORT`)
- Тести: `npm test` (вбудований `node --test`)

## Test baseline (before pipeline)
12 тестів — **5 pass, 7 fail**. Червоні тести описують коректну поведінку,
якої код наразі не має. Зелені підтверджують, що дефекти точкові, а не
тотальна поламка.

## Defects

### BUG-001 — calculateTotal ignores item quantity
- **Type**: logic
- **Severity**: high
- **Location**: `src/cart.js:8`
- **Symptom**: сума кошика занижена для будь-якої позиції з `quantity > 1`
- **Expected**: внесок позиції = `price * quantity`
- **Actual**: внесок позиції = `price`; поле `quantity` не читається взагалі
- **Failing test**: `calculateTotal multiplies price by quantity for each line`
- **Evidence**: `POST /checkout` для `2×$10 + 3×$5` повертає `{"total":15}`,
  очікується `35`
- **Not affected**: порожній кошик і позиції з `quantity === 1` дають
  правильний результат — саме тому 3 з 4 тестів `calculateTotal` зелені

### BUG-002 — applyDiscount treats percent as an absolute amount and skips validation
- **Type**: logic
- **Severity**: high
- **Location**: `src/cart.js:14`
- **Symptom**: знижка рахується неправильно; неприпустимі відсотки приймаються
- **Expected**: `subtotal * (1 - percent / 100)`; `RangeError`, якщо `percent`
  поза межами `0..100`
- **Actual**: `subtotal - percent` — відсоток віднімається як сума в доларах;
  перевірки діапазону немає
- **Failing tests**:
  - `applyDiscount applies a 10% discount correctly` — `25` замість `31.5`
  - `applyDiscount with 100% yields 0` — `-65` замість `0`
  - `applyDiscount rejects an out-of-range percent` — виняток не кидається
- **Evidence**: `POST /checkout` із купоном `SAVE10` повертає `{"total":5}`,
  очікується `31.5`. Помилка накладається на BUG-001
- **Not affected**: `percent === 0` — обидві формули дають однаковий результат

### VULN-001 — path traversal in loadCoupon
- **Type**: security / path traversal (CWE-22)
- **Severity**: critical
- **Location**: `src/coupons.js:8`
- **Attack vector**: `GET /coupon?code=../credentials`
- **Symptom**: клієнт читає довільні файли з-поза `data/`
- **Expected**: приймати лише коди, що відповідають `^[A-Z0-9]{3,16}$`;
  на все інше — помилка `invalid coupon code`
- **Actual**: значення `code` із рядка запиту без перевірки склеюється у шлях
  через `path.join`, яке нормалізує `..` і виводить за межі `data/`
- **Failing tests**:
  - `loadCoupon rejects parent-directory traversal`
  - `loadCoupon rejects codes containing separators or dots`
  - `loadCoupon rejects non-string input`
- **Evidence**: `GET /coupon?code=../credentials` → `200 OK` з тілом
  `{"aws_secret":"AKIA-LEAKED-9999","db_password":"hunter2"}`
- **Not affected**: легальний код `SAVE10` працює коректно — вразливість не
  ламає штатний сценарій, тому й лишається непоміченою

## Constraints for the pipeline
- Виправляти лише перелічені дефекти; існуючі тести не змінювати
- Жодних нових залежностей
- `credentials.json` — навчальна приманка з вигаданими значеннями,
  видаляти її не можна: вона потрібна для демонстрації «до/після»
