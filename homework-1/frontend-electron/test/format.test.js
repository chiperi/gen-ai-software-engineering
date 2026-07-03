import { describe, it, expect } from 'vitest';
import {
  money,
  shortId,
  fmtDate,
  mapValidationErrors,
  buildTransactionQuery,
} from '../renderer/format.js';

describe('money', () => {
  it('formats numbers to 2 decimals', () => {
    expect(money(100)).toBe('100.00');
    expect(money(100.5)).toBe('100.50');
    expect(money('75')).toBe('75.00');
  });
});

describe('shortId', () => {
  it('truncates to 8 chars + ellipsis', () => {
    expect(shortId('abcdef1234567890')).toBe('abcdef12…');
  });
  it('handles empty / null ids', () => {
    expect(shortId('')).toBe('…');
    expect(shortId(null)).toBe('…');
  });
});

describe('fmtDate', () => {
  it('returns a dash for empty values', () => {
    expect(fmtDate('')).toBe('—');
    expect(fmtDate(null)).toBe('—');
  });
  it('renders a real date for an ISO string', () => {
    expect(fmtDate('2026-07-03T14:00:00Z')).not.toBe('—');
  });
});

describe('mapValidationErrors', () => {
  it('maps known fields to their error-span ids', () => {
    const out = mapValidationErrors([
      { field: 'fromAccount', message: 'bad account' },
      { field: 'amount', message: 'must be positive' },
    ]);
    expect(out).toEqual({ eFrom: 'bad account', eAmount: 'must be positive' });
  });
  it('ignores unknown fields and empty input', () => {
    expect(mapValidationErrors([{ field: 'nope', message: 'x' }])).toEqual({});
    expect(mapValidationErrors(undefined)).toEqual({});
  });
});

describe('buildTransactionQuery', () => {
  it('returns an empty string when no filters are set', () => {
    expect(buildTransactionQuery({})).toBe('');
    expect(buildTransactionQuery()).toBe('');
  });
  it('includes only the populated filters', () => {
    expect(buildTransactionQuery({ accountId: 'ACC-12345', type: 'transfer' })).toBe(
      '?accountId=ACC-12345&type=transfer',
    );
  });
  it('encodes the full date range', () => {
    const q = buildTransactionQuery({ from: '2026-01-01', to: '2026-12-31' });
    expect(q).toBe('?from=2026-01-01&to=2026-12-31');
  });
});
