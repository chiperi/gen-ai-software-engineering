import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

const COUPON_CODE = /^[A-Z0-9]{3,16}$/;

export function loadCoupon(code) {
  if (typeof code !== 'string' || !COUPON_CODE.test(code)) {
    throw new Error('invalid coupon code');
  }
  const file = path.join(DATA_DIR, `${code}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
