'use strict';

const http = require('node:http');
const semver = require('semver');

const { calculateTotal, applyDiscount } = require('./cart');
const { loadCoupon } = require('./coupons');
const { isAdmin } = require('./auth');

const PORT = Number(process.env.PORT) || 3000;
const API_VERSION = '1.4.0';

/** Orders placed during the lifetime of this process. */
const orders = [];

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);

  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendHtml(res, status, html) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html),
  });
  res.end(html);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/** GET /coupon?code=SAVE10 — look up a coupon by its code. */
function handleCoupon(res, url) {
  const code = url.searchParams.get('code');

  if (!code) {
    return sendJson(res, 400, { error: 'code is required' });
  }

  try {
    return sendJson(res, 200, loadCoupon(code));
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
}

/** POST /checkout — place an order. */
async function handleCheckout(req, res) {
  let payload;

  try {
    payload = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'body must be valid JSON' });
  }

  const items = payload.items || [];
  let total = calculateTotal(items);

  if (payload.coupon) {
    let coupon;

    try {
      coupon = loadCoupon(payload.coupon);
    } catch {
      return sendJson(res, 400, { error: 'unknown coupon' });
    }

    total = applyDiscount(total, coupon.percent);
  }

  orders.push({
    id: orders.length + 1,
    customer: payload.customer || 'anonymous',
    items,
    total,
    createdAt: new Date().toISOString(),
  });

  return sendJson(res, 200, { total });
}

/** GET /confirm?name=Olena — order confirmation page. */
function handleConfirm(res, url) {
  const name = url.searchParams.get('name') || 'guest';
  const last = orders[orders.length - 1];
  const total = last ? last.total : 0;

  return sendHtml(
    res,
    200,
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Order confirmed</title>
  </head>
  <body>
    <h1>Thank you, ${name}!</h1>
    <p>Your order has been accepted for processing.</p>
    <p>Amount due: <strong>${total}</strong></p>
    <p><a href="/">Back to the cart</a></p>
  </body>
</html>
`,
  );
}

/** GET /admin/report — list of orders, for administrators. */
function handleAdminReport(req, res) {
  const token = req.headers['x-admin-token'] || '';

  if (!isAdmin(token)) {
    return sendJson(res, 403, { error: 'forbidden' });
  }

  return sendJson(res, 200, { count: orders.length, orders });
}

/** GET /version?range=^1.0.0 — API version compatibility. */
function handleVersion(res, url) {
  const range = url.searchParams.get('range') || '*';

  return sendJson(res, 200, {
    version: API_VERSION,
    satisfies: semver.satisfies(API_VERSION, range),
  });
}

function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/coupon') {
      return handleCoupon(res, url);
    }

    if (req.method === 'POST' && url.pathname === '/checkout') {
      return handleCheckout(req, res);
    }

    if (req.method === 'GET' && url.pathname === '/confirm') {
      return handleConfirm(res, url);
    }

    if (req.method === 'GET' && url.pathname === '/admin/report') {
      return handleAdminReport(req, res);
    }

    if (req.method === 'GET' && url.pathname === '/version') {
      return handleVersion(res, url);
    }

    return sendJson(res, 404, { error: 'not found' });
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    process.stdout.write(`cart service listening on http://localhost:${PORT}\n`);
  });
}

module.exports = { createServer, orders };
