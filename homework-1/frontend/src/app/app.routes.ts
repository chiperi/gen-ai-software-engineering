import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'transactions' },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./pages/transactions/transactions-page').then((m) => m.TransactionsPage),
  },
  {
    path: 'transactions/new',
    loadComponent: () =>
      import('./pages/transactions/create-transaction').then((m) => m.CreateTransaction),
  },
  {
    path: 'transactions/:id',
    loadComponent: () =>
      import('./pages/transactions/transaction-details').then((m) => m.TransactionDetails),
  },
  {
    path: 'accounts',
    loadComponent: () => import('./pages/accounts/account-tools').then((m) => m.AccountTools),
  },
  { path: '**', redirectTo: 'transactions' },
];
