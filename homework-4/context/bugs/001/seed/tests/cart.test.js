'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateTotal, applyDiscount } = require('../src/cart');
const { loadCoupon } = require('../src/coupons');

test('calculateTotal: an empty cart costs nothing', () => {
  assert.equal(calculateTotal([]), 0);
});

test('calculateTotal: a single item with quantity 1 costs its price', () => {
  const items = [{ sku: 'A', price: 10, quantity: 1 }];

  assert.equal(calculateTotal(items), 10);
});

test('calculateTotal: a single item is charged once per unit', () => {
  const items = [{ sku: 'B', price: 5, quantity: 3 }];

  assert.equal(calculateTotal(items), 15);
});

test('calculateTotal: sums every line of a multi-item cart', () => {
  const items = [
    { sku: 'A', price: 10, quantity: 2 },
    { sku: 'B', price: 5, quantity: 3 },
  ];

  assert.equal(calculateTotal(items), 35);
});

test('calculateTotal: handles a large quantity of a cheap item', () => {
  const items = [{ sku: 'C', price: 2.5, quantity: 10 }];

  assert.equal(calculateTotal(items), 25);
});

test('applyDiscount: a 0% coupon leaves the total unchanged', () => {
  assert.equal(applyDiscount(100, 0), 100);
});

test('applyDiscount: 10% off 200 is 180', () => {
  assert.equal(applyDiscount(200, 10), 180);
});

test('applyDiscount: 25% off 80 is 60', () => {
  assert.equal(applyDiscount(80, 25), 60);
});

test('applyDiscount: 50% off 40 is 20', () => {
  assert.equal(applyDiscount(40, 50), 20);
});

test('applyDiscount: a 100% coupon brings the total to zero', () => {
  assert.equal(applyDiscount(80, 100), 0);
});

test('loadCoupon: reads SAVE10 from the coupon store', () => {
  const coupon = loadCoupon('SAVE10');

  assert.equal(coupon.code, 'SAVE10');
  assert.equal(coupon.percent, 10);
});

test('loadCoupon: reads HALFOFF from the coupon store', () => {
  const coupon = loadCoupon('HALFOFF');

  assert.equal(coupon.code, 'HALFOFF');
  assert.equal(coupon.percent, 50);
});
