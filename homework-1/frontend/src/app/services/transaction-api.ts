import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  BalanceResponse,
  InterestResponse,
  SummaryResponse,
  Transaction,
  TransactionFilters,
  TransactionRequest,
} from '../models/transaction';

/**
 * Typed gateway to the Banking API. All calls go through the dev proxy (/api -> :3000).
 */
@Injectable({ providedIn: 'root' })
export class TransactionApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  list(filters: TransactionFilters = {}): Observable<Transaction[]> {
    let params = new HttpParams();
    if (filters.accountId) params = params.set('accountId', filters.accountId);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return this.http.get<Transaction[]>(`${this.base}/transactions`, { params });
  }

  getById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.base}/transactions/${id}`);
  }

  create(request: TransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.base}/transactions`, request);
  }

  balance(accountId: string): Observable<BalanceResponse> {
    return this.http.get<BalanceResponse>(`${this.base}/accounts/${accountId}/balance`);
  }

  summary(accountId: string): Observable<SummaryResponse> {
    return this.http.get<SummaryResponse>(`${this.base}/accounts/${accountId}/summary`);
  }

  interest(accountId: string, rate: number, days: number): Observable<InterestResponse> {
    const params = new HttpParams().set('rate', rate).set('days', days);
    return this.http.get<InterestResponse>(`${this.base}/accounts/${accountId}/interest`, {
      params,
    });
  }

  exportCsv(): Observable<Blob> {
    const params = new HttpParams().set('format', 'csv');
    return this.http.get(`${this.base}/transactions/export`, { params, responseType: 'blob' });
  }
}
