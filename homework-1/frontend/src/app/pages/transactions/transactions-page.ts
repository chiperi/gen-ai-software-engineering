import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ToastService } from '../../core/toast.service';
import { Transaction } from '../../models/transaction';
import { TransactionApiService } from '../../services/transaction-api';

@Component({
  selector: 'app-transactions-page',
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="header-row">
      <h1>Transactions</h1>
      <div class="actions">
        <button class="btn" (click)="exportCsv()">⤓ Export CSV</button>
        <a class="btn btn-primary" routerLink="/transactions/new">+ New transaction</a>
      </div>
    </div>

    <div class="card filters">
      <div class="row">
        <div class="field grow">
          <label class="label" for="f-acc">Account</label>
          <input id="f-acc" class="input" [(ngModel)]="accountId" placeholder="ACC-12345" />
        </div>
        <div class="field grow">
          <label class="label" for="f-type">Type</label>
          <select id="f-type" class="input" [(ngModel)]="type">
            <option value="">All</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        <div class="field grow">
          <label class="label" for="f-from">From</label>
          <input id="f-from" class="input" type="date" [(ngModel)]="from" />
        </div>
        <div class="field grow">
          <label class="label" for="f-to">To</label>
          <input id="f-to" class="input" type="date" [(ngModel)]="to" />
        </div>
        <div class="field">
          <button class="btn btn-primary" (click)="load()">Apply</button>
        </div>
        <div class="field">
          <button class="btn" (click)="clear()">Clear</button>
        </div>
      </div>
    </div>

    <div class="card">
      @if (loading()) {
        <div class="empty">Loading…</div>
      } @else if (error()) {
        <div class="empty">{{ error() }}</div>
      } @else if (transactions().length === 0) {
        <div class="empty">No transactions found.</div>
      } @else {
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            @for (t of transactions(); track t.id) {
              <tr>
                <td><a [routerLink]="['/transactions', t.id]">{{ t.id.slice(0, 8) }}…</a></td>
                <td>{{ t.fromAccount }}</td>
                <td>{{ t.toAccount }}</td>
                <td>{{ t.amount | number: '1.2-2' }} {{ t.currency }}</td>
                <td class="cap">{{ t.type }}</td>
                <td><span class="badge" [class]="t.status">{{ t.status }}</span></td>
                <td class="muted">{{ t.timestamp | date: 'short' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [
    `
      .header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--s-4);
      }
      .header-row h1 {
        margin: 0;
      }
      .actions {
        display: flex;
        gap: var(--s-2);
      }
      .filters {
        margin-bottom: var(--s-4);
      }
      .filters .field {
        margin-bottom: 0;
      }
      .filters .grow {
        flex: 1 1 0;
        min-width: 150px;
      }
      .cap {
        text-transform: capitalize;
      }
    `,
  ],
})
export class TransactionsPage {
  private readonly api = inject(TransactionApiService);
  private readonly toast = inject(ToastService);

  readonly transactions = signal<Transaction[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  accountId = '';
  type = '';
  from = '';
  to = '';

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list({ accountId: this.accountId, type: this.type, from: this.from, to: this.to })
      .subscribe({
        next: (tx) => {
          this.transactions.set(tx);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Could not load transactions. Make sure the API is running on :3000.');
          this.loading.set(false);
        },
      });
  }

  clear(): void {
    this.accountId = '';
    this.type = '';
    this.from = '';
    this.to = '';
    this.load();
  }

  exportCsv(): void {
    this.api.exportCsv().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('Export failed.'),
    });
  }
}
