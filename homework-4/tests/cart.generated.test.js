import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotal, applyDiscount } from '../src/cart.js';

test('calculateTotal treats a quantity of 0 as contributing nothing to the total', () => {
    const items = [{ price: 100, quantity: 0 }];
    assert.equal(calculateTotal(items), 0);
});

test('calculateTotal (BUG-001 regression) honours quantity greater than one', () => {
    const items = [
        { price: 7, quantity: 4 },
        { price: 3, quantity: 1 },
    ];
    assert.equal(calculateTotal(items), 31);
});

test('applyDiscount rejects a non-numeric percent', () => {
    assert.throws(() => applyDiscount(35, '10'), RangeError);
    assert.throws(() => applyDiscount(35, NaN), RangeError);
});

test('applyDiscount returns 0 when subtotal is 0', () => {
    assert.equal(applyDiscount(0, 50), 0);
});

test('applyDiscount (BUG-002 regression) multiplies the percent instead of subtracting it', () => {
    assert.equal(applyDiscount(50, 20), 40);
});
