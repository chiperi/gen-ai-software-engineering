import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCoupon } from '../src/coupons.js';

test('loadCoupon rejects codes shorter than the minimum length', () => {
    assert.throws(() => loadCoupon('AB'), /invalid coupon code/);
});

test('loadCoupon rejects codes longer than the maximum length', () => {
    assert.throws(() => loadCoupon('A'.repeat(17)), /invalid coupon code/);
});

test('loadCoupon rejects an empty string', () => {
    assert.throws(() => loadCoupon(''), /invalid coupon code/);
});

test('loadCoupon rejects lowercase letters', () => {
    assert.throws(() => loadCoupon('save10'), /invalid coupon code/);
});

test('loadCoupon (VULN-001 regression) rejects an alternate-encoding traversal payload', () => {
    assert.throws(() => loadCoupon('..\\credentials'), /invalid coupon code/);
    assert.throws(() => loadCoupon('....//credentials'), /invalid coupon code/);
});
