import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

export function loadCoupon(code) {
  const file = path.join(DATA_DIR, `${code}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
