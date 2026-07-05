import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Transaction } from '../../models/transaction';
import { TransactionApiService } from '../../services/transaction-api';

@Component({
  selector: 'app-transaction-details',
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <a class="muted" routerLink="/transactions">← Back to transactions</a>
    <h1>Transaction</h1>

    @if (loading()) {
      <div class="card empty">Loading…</div>
    } @else if (notFound()) {
      <div class="card empty">Transaction not found.</div>
    } @else if (tx(); as t) {
      <div class="card detail">
        <div class="row-2"><span class="k">ID</span><span class="v">{{ t.id }}</span></div>
        <div class="row-2"><span class="k">From</span><span class="v">{{ t.fromAccount }}</span></div>
        <div class="row-2"><span class="k">To</span><span class="v">{{ t.toAccount }}</span></div>
        <div class="row-2"><span class="k">Amount</span><span class="v">{{ t.amount | number: '1.2-2' }} {{ t.currency }}</span></div>
        <div class="row-2"><span class="k">Type</span><span class="v cap">{{ t.type }}</span></div>
        <div class="row-2"><span class="k">Status</span><span class="v"><span class="badge" [class]="t.status">{{ t.status }}</span></span></div>
        <div class="row-2"><span class="k">Timestamp</span><span class="v">{{ t.timestamp | date: 'medium' }}</span></div>
      </div>
    }
  `,
  styles: [
    `
      .detail {
        max-width: 640px;
      }
      .row-2 {
        display: flex;
        padding: 10px 0;
        border-bottom: 1px solid var(--border);
      }
      .row-2:last-child {
        border-bottom: none;
      }
      .k {
        width: 140px;
        color: var(--text-secondary);
        font-weight: 600;
      }
      .v {
        flex: 1;
        word-break: break-all;
      }
      .cap {
        text-transform: capitalize;
      }
    `,
  ],
})
export class TransactionDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(TransactionApiService);

  readonly tx = signal<Transaction | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.api.getById(id).subscribe({
      next: (t) => {
        this.tx.set(t);
        this.loading.set(false);
      },
      error: (_err: HttpErrorResponse) => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }
}
