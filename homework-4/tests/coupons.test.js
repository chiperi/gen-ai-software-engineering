import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCoupon } from '../src/coupons.js';

test('loadCoupon reads a valid coupon by code', () => {
  assert.deepEqual(loadCoupon('SAVE10'), { code: 'SAVE10', percent: 10 });
});

test('loadCoupon rejects parent-directory traversal', () => {
  assert.throws(() => loadCoupon('../credentials'), /invalid coupon code/);
  assert.throws(() => loadCoupon('../../../../etc/passwd'), /invalid coupon code/);
});

test('loadCoupon rejects codes containing separators or dots', () => {
  assert.throws(() => loadCoupon('a/b'), /invalid coupon code/);
  assert.throws(() => loadCoupon('save.10'), /invalid coupon code/);
});

test('loadCoupon rejects non-string input', () => {
  assert.throws(() => loadCoupon(null), /invalid coupon code/);
  assert.throws(() => loadCoupon(42), /invalid coupon code/);
});
