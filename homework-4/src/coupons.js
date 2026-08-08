'use strict';

const fs = require('node:fs');
const path = require('node:path');

const COUPONS_DIR = path.join(__dirname, '..', 'data', 'coupons');

/**
 * Loads a coupon by its code.
 *
 * Coupons are stored as one JSON file per code under data/coupons.
 *
 * @param {string} code coupon code, for example "SAVE10"
 * @returns {{code: string, percent: number}} the coupon
 */
function loadCoupon(code) {
  const file = path.join(COUPONS_DIR, `${code}.json`);
  const raw = fs.readFileSync(file, 'utf8');

  return JSON.parse(raw);
}

module.exports = { loadCoupon, COUPONS_DIR };
