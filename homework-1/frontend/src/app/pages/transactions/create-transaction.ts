import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ToastService } from '../../core/toast.service';
import { ApiError, TransactionRequest } from '../../models/transaction';
import { TransactionApiService } from '../../services/transaction-api';

@Component({
  selector: 'app-create-transaction',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1>New transaction</h1>

    <div class="card form-card">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid">
          <div class="field">
            <label class="label" for="from">From account</label>
            <input id="from" class="input" formControlName="fromAccount" placeholder="ACC-12345"
              [class.invalid]="invalid('fromAccount')" />
            @if (invalid('fromAccount')) {
              <span class="error-text">Must match ACC-XXXXX.</span>
            }
            @if (fieldErrors()['fromAccount']) {
              <span class="error-text">{{ fieldErrors()['fromAccount'] }}</span>
            }
          </div>

          <div class="field">
            <label class="label" for="to">To account</label>
            <input id="to" class="input" formControlName="toAccount" placeholder="ACC-67890"
              [class.invalid]="invalid('toAccount')" />
            @if (invalid('toAccount')) {
              <span class="error-text">Must match ACC-XXXXX.</span>
            }
            @if (fieldErrors()['toAccount']) {
              <span class="error-text">{{ fieldErrors()['toAccount'] }}</span>
            }
          </div>

          <div class="field">
            <label class="label" for="amount">Amount</label>
            <input id="amount" class="input" type="number" step="0.01" formControlName="amount"
              placeholder="100.50" [class.invalid]="invalid('amount')" />
            @if (invalid('amount')) {
              <span class="error-text">Enter a positive amount (max 2 decimals).</span>
            }
            @if (fieldErrors()['amount']) {
              <span class="error-text">{{ fieldErrors()['amount'] }}</span>
            }
          </div>

          <div class="field">
            <label class="label" for="currency">Currency</label>
            <select id="currency" class="input" formControlName="currency">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
            @if (fieldErrors()['currency']) {
              <span class="error-text">{{ fieldErrors()['currency'] }}</span>
            }
          </div>

          <div class="field">
            <label class="label" for="type">Type</label>
            <select id="type" class="input" formControlName="type">
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
            </select>
            @if (fieldErrors()['type']) {
              <span class="error-text">{{ fieldErrors()['type'] }}</span>
            }
          </div>
        </div>

        <div class="row" style="margin-top: 8px;">
          <button class="btn btn-primary" type="submit" [disabled]="submitting()">
            {{ submitting() ? 'Creating…' : 'Create transaction' }}
          </button>
          <a class="btn" routerLink="/transactions">Cancel</a>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .form-card {
        max-width: 720px;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 var(--s-4);
      }
      @media (max-width: 560px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CreateTransaction {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TransactionApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly fieldErrors = signal<Record<string, string>>({});

  readonly form = this.fb.nonNullable.group({
    fromAccount: ['', [Validators.required, Validators.pattern(/^ACC-[A-Za-z0-9]+$/)]],
    toAccount: ['', [Validators.required, Validators.pattern(/^ACC-[A-Za-z0-9]+$/)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    currency: ['USD', Validators.required],
    type: ['transfer', Validators.required],
  });

  invalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.fieldErrors.set({});

    this.api.create(this.form.getRawValue() as TransactionRequest).subscribe({
      next: () => {
        this.toast.success('Transaction created.');
        this.router.navigate(['/transactions']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const body = err.error as ApiError | undefined;
        if (err.status === 400 && body?.details) {
          const map: Record<string, string> = {};
          for (const d of body.details) {
            map[d.field] = d.message;
          }
          this.fieldErrors.set(map);
        } else if (err.status !== 429) {
          this.toast.error('Could not create transaction.');
        }
      },
    });
  }
}
