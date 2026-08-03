import http from 'node:http';
import { calculateTotal, applyDiscount } from './cart.js';
import { loadCoupon } from './coupons.js';

const PORT = process.env.PORT || 3000;

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/coupon') {
    const code = url.searchParams.get('code');
    try {
      return send(res, 200, loadCoupon(code));
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
  }

  if (req.method === 'POST' && url.pathname === '/checkout') {
    try {
      const { items = [], coupon } = await readBody(req);
      const subtotal = calculateTotal(items);
      const percent = coupon ? loadCoupon(coupon).percent : 0;
      return send(res, 200, { total: applyDiscount(subtotal, percent) });
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
  }

  send(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`cart service listening on http://localhost:${PORT}`);
});
