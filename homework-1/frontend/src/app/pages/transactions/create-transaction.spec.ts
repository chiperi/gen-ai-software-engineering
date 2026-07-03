import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { CreateTransaction } from './create-transaction';
import { ToastService } from '../../core/toast.service';

function makeComponent() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const fixture = TestBed.createComponent(CreateTransaction);
  return {
    fixture,
    cmp: fixture.componentInstance,
    http: TestBed.inject(HttpTestingController),
    router: TestBed.inject(Router),
    toast: TestBed.inject(ToastService),
  };
}

const validValues = {
  fromAccount: 'ACC-12345',
  toAccount: 'ACC-67890',
  amount: 100.5,
  currency: 'USD',
  type: 'transfer' as const,
};

describe('CreateTransaction', () => {
  it('does not submit an invalid (empty) form', () => {
    const { cmp, http } = makeComponent();

    cmp.submit();

    http.expectNone('/api/transactions');
    expect(cmp.form.touched).toBe(true);
    expect(cmp.submitting()).toBe(false);
  });

  it('flags an invalid account format via the pattern validator', () => {
    const { cmp } = makeComponent();
    cmp.form.setValue({ ...validValues, fromAccount: 'BADACC' });
    cmp.form.get('fromAccount')!.markAsTouched();

    expect(cmp.invalid('fromAccount')).toBe(true);
    expect(cmp.invalid('toAccount')).toBe(false);
  });

  it('maps a 400 details[] response to per-field errors', () => {
    const { cmp, http } = makeComponent();
    cmp.form.setValue(validValues);

    cmp.submit();

    http.expectOne('/api/transactions').flush(
      {
        error: 'Validation failed',
        details: [
          { field: 'fromAccount', message: 'account must match ACC-XXXXX' },
          { field: 'amount', message: 'amount must be a positive number' },
        ],
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(cmp.fieldErrors()['fromAccount']).toBe('account must match ACC-XXXXX');
    expect(cmp.fieldErrors()['amount']).toBe('amount must be a positive number');
    expect(cmp.submitting()).toBe(false);
  });

  it('toasts success and navigates on 201', () => {
    const { cmp, http, router, toast } = makeComponent();
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const ok = vi.spyOn(toast, 'success');
    cmp.form.setValue(validValues);

    cmp.submit();

    http.expectOne('/api/transactions').flush({ id: 'x', ...validValues, timestamp: '', status: 'completed' });

    expect(ok).toHaveBeenCalledWith('Transaction created.');
    expect(nav).toHaveBeenCalledWith(['/transactions']);
  });
});
