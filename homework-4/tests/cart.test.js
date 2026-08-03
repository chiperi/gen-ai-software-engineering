import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotal, applyDiscount } from '../src/cart.js';

test('calculateTotal multiplies price by quantity for each line', () => {
    const items = [
        { price: 10, quantity: 2 },
        { price: 5, quantity: 3 },
    ];
    assert.equal(calculateTotal(items), 35);
});

test('calculateTotal returns 0 for an empty cart', () => {
    assert.equal(calculateTotal([]), 0);
});

test('calculateTotal treats a single unit as price * 1', () => {
    assert.equal(calculateTotal([{ price: 42, quantity: 1 }]), 42);
});

test('calculateTotal throws a TypeError when items is not an array', () => {
    assert.throws(() => calculateTotal('not an array'), TypeError);
});

test('applyDiscount applies a 10% discount correctly', () => {
    assert.equal(applyDiscount(35, 10), 31.5);
});

test('applyDiscount with 0% leaves the subtotal unchanged', () => {
    assert.equal(applyDiscount(35, 0), 35);
});

test('applyDiscount with 100% yields 0', () => {
    assert.equal(applyDiscount(35, 100), 0);
});

test('applyDiscount rejects an out-of-range percent', () => {
    assert.throws(() => applyDiscount(35, 150), RangeError);
    assert.throws(() => applyDiscount(35, -5), RangeError);
});