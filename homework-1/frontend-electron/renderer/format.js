// Pure, framework-free helpers shared by the renderer.
// UMD wrapper so the same file works as a <script> in the browser (window.Fmt)
// and as a CommonJS module under Vitest/Node (require('./format')).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Fmt = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const money = (n) => Number(n).toFixed(2);
  const shortId = (id) => (id || '').slice(0, 8) + '…';
  const fmtDate = (s) => (s ? new Date(s).toLocaleString() : '—');

  // Maps each backend validation field to the id of its error <span> in the DOM.
  const ERR_FIELD_MAP = {
    fromAccount: 'eFrom',
    toAccount: 'eTo',
    amount: 'eAmount',
    currency: 'eCurrency',
    type: 'eType',
  };

  // Turn a backend 400 body's details[] into { errorSpanId: message }.
  const mapValidationErrors = (details) => {
    const out = {};
    for (const d of details || []) {
      const spanId = ERR_FIELD_MAP[d.field];
      if (spanId) out[spanId] = d.message;
    }
    return out;
  };

  // Build the /transactions query string from the filter inputs.
  const buildTransactionQuery = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.accountId) params.set('accountId', filters.accountId);
    if (filters.type) params.set('type', filters.type);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    const q = params.toString();
    return q ? '?' + q : '';
  };

  return { money, shortId, fmtDate, ERR_FIELD_MAP, mapValidationErrors, buildTransactionQuery };
});
