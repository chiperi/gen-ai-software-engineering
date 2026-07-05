import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ToastService } from '../../core/toast.service';
import { BalanceResponse, InterestResponse, SummaryResponse } from '../../models/transaction';
import { TransactionApiService } from '../../services/transaction-api';

@Component({
  selector: 'app-account-tools',
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <h1>Account tools</h1>

    <!-- Balance -->
    <div class="card">
      <h2>Balance</h2>
      <div class="row">
        <div class="field">
          <label class="label" for="bal-acc">Account</label>
          <input id="bal-acc" class="input" [(ngModel)]="balanceAccount" placeholder="ACC-12345" />
        </div>
        <div class="field">
          <button class="btn btn-primary" (click)="loadBalance()" [disabled]="!balanceAccount">Get balance</button>
        </div>
      </div>
      @if (balance(); as b) {
        <div class="stat" style="max-width: 240px;">
          <div class="muted">{{ b.accountId }}</div>
          <div class="value">{{ b.balance | number: '1.2-2' }}</div>
        </div>
      }
    </div>

    <!-- Summary -->
    <div class="card">
      <h2>Summary</h2>
      <div class="row">
        <div class="field">
          <label class="label" for="sum-acc">Account</label>
          <input id="sum-acc" class="input" [(ngModel)]="summaryAccount" placeholder="ACC-12345" />
        </div>
        <div class="field">
          <button class="btn btn-primary" (click)="loadSummary()" [disabled]="!summaryAccount">Get summary</button>
        </div>
      </div>
      @if (summary(); as s) {
        <div class="stat-grid">
          <div class="stat"><div class="muted">Total deposits</div><div class="value">{{ s.totalDeposits | number: '1.2-2' }}</div></div>
          <div class="stat"><div class="muted">Total withdrawals</div><div class="value">{{ s.totalWithdrawals | number: '1.2-2' }}</div></div>
          <div class="stat"><div class="muted">Transactions</div><div class="value">{{ s.transactionCount }}</div></div>
          <div class="stat"><div class="muted">Most recent</div><div class="value sm">{{ s.mostRecentTransactionDate ? (s.mostRecentTransactionDate | date: 'short') : '—' }}</div></div>
        </div>
      }
    </div>

    <!-- Interest -->
    <div class="card">
      <h2>Simple interest</h2>
      <div class="row">
        <div class="field">
          <label class="label" for="int-acc">Account</label>
          <input id="int-acc" class="input" [(ngModel)]="interestAccount" placeholder="ACC-12345" />
        </div>
        <div class="field">
          <label class="label" for="int-rate">Rate</label>
          <input id="int-rate" class="input" type="number" step="0.01" [(ngModel)]="rate" />
        </div>
        <div class="field">
          <label class="label" for="int-days">Days</label>
          <input id="int-days" class="input" type="number" [(ngModel)]="days" />
        </div>
        <div class="field">
          <button class="btn btn-primary" (click)="loadInterest()" [disabled]="!interestAccount">Calculate</button>
        </div>
      </div>
      @if (interest(); as i) {
        <div class="stat-grid">
          <div class="stat"><div class="muted">Balance</div><div class="value">{{ i.balance | number: '1.2-2' }}</div></div>
          <div class="stat"><div class="muted">Rate</div><div class="value">{{ i.rate }}</div></div>
          <div class="stat"><div class="muted">Days</div><div class="value">{{ i.days }}</div></div>
          <div class="stat"><div class="muted">Interest</div><div class="value">{{ i.interest | number: '1.2-2' }}</div></div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .row .field {
        margin-bottom: 0;
      }
      .value.sm {
        font-size: 16px;
      }
    `,
  ],
})
export class AccountTools {
  private readonly api = inject(TransactionApiService);
  private readonly toast = inject(ToastService);

  balanceAccount = '';
  summaryAccount = '';
  interestAccount = '';
  rate = 0.05;
  days = 30;

  readonly balance = signal<BalanceResponse | null>(null);
  readonly summary = signal<SummaryResponse | null>(null);
  readonly interest = signal<InterestResponse | null>(null);

  loadBalance(): void {
    this.api.balance(this.balanceAccount).subscribe({
      next: (b) => this.balance.set(b),
      error: () => this.toast.error('Could not load balance.'),
    });
  }

  loadSummary(): void {
    this.api.summary(this.summaryAccount).subscribe({
      next: (s) => this.summary.set(s),
      error: () => this.toast.error('Could not load summary.'),
    });
  }

  loadInterest(): void {
    this.api.interest(this.interestAccount, this.rate, this.days).subscribe({
      next: (i) => this.interest.set(i),
      error: () => this.toast.error('Could not calculate interest (check rate and days).'),
    });
  }
}
