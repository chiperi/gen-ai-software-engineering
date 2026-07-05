import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TransactionApiService } from './transaction-api';
import { Transaction } from '../models/transaction';

const sampleTx: Transaction = {
  id: 'abc-123',
  fromAccount: 'ACC-12345',
  toAccount: 'ACC-67890',
  amount: 100.5,
  currency: 'USD',
  type: 'transfer',
  timestamp: '2026-07-03T14:00:00Z',
  status: 'completed',
};

describe('TransactionApiService', () => {
  let api: TransactionApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TransactionApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists transactions without filters', () => {
    let result: Transaction[] | undefined;
    api.list().subscribe((r) => (result = r));

    const req = http.expectOne('/api/transactions');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([sampleTx]);

    expect(result).toEqual([sampleTx]);
  });

  it('passes accountId + type + date range as query params', () => {
    api.list({ accountId: 'ACC-12345', type: 'transfer', from: '2026-01-01', to: '2026-12-31' }).subscribe();

    const req = http.expectOne((r) => r.url === '/api/transactions');
    expect(req.request.params.get('accountId')).toBe('ACC-12345');
    expect(req.request.params.get('type')).toBe('transfer');
    expect(req.request.params.get('from')).toBe('2026-01-01');
    expect(req.request.params.get('to')).toBe('2026-12-31');
    req.flush([]);
  });

  it('POSTs a create request with the JSON body', () => {
    const body = {
      fromAccount: 'ACC-12345',
      toAccount: 'ACC-67890',
      amount: 100.5,
      currency: 'USD',
      type: 'transfer' as const,
    };
    api.create(body).subscribe();

    const req = http.expectOne('/api/transactions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(sampleTx);
  });

  it('fetches balance / summary / interest with the right URLs', () => {
    api.balance('ACC-12345').subscribe();
    http.expectOne('/api/accounts/ACC-12345/balance').flush({ accountId: 'ACC-12345', balance: 10 });

    api.summary('ACC-12345').subscribe();
    http
      .expectOne('/api/accounts/ACC-12345/summary')
      .flush({ totalDeposits: 0, totalWithdrawals: 0, transactionCount: 0, mostRecentTransactionDate: null });

    api.interest('ACC-12345', 0.05, 30).subscribe();
    const interestReq = http.expectOne((r) => r.url === '/api/accounts/ACC-12345/interest');
    expect(interestReq.request.params.get('rate')).toBe('0.05');
    expect(interestReq.request.params.get('days')).toBe('30');
    interestReq.flush({ accountId: 'ACC-12345', balance: 10, rate: 0.05, days: 30, interest: 0.04 });
  });

  it('requests the CSV export as a blob', () => {
    api.exportCsv().subscribe();
    const req = http.expectOne((r) => r.url === '/api/transactions/export');
    expect(req.request.params.get('format')).toBe('csv');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['id,fromAccount\n'], { type: 'text/csv' }));
  });
});
