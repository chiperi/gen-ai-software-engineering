export type TransactionType = 'deposit' | 'withdrawal' | 'transfer';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  type: TransactionType;
  timestamp: string;
  status: TransactionStatus;
}

export interface TransactionRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  type: TransactionType;
}

export interface TransactionFilters {
  accountId?: string;
  type?: string;
  from?: string;
  to?: string;
}

export interface BalanceResponse {
  accountId: string;
  balance: number;
}

export interface SummaryResponse {
  totalDeposits: number;
  totalWithdrawals: number;
  transactionCount: number;
  mostRecentTransactionDate: string | null;
}

export interface InterestResponse {
  accountId: string;
  balance: number;
  rate: number;
  days: number;
  interest: number;
}

export interface ValidationDetail {
  field: string;
  message: string;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: ValidationDetail[];
}
