package com.example.banking.web.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Aggregated view of an account's activity (Task 4A).
 * {@code mostRecentTransactionDate} is null when the account has no transactions.
 */
public record SummaryResponse(
        BigDecimal totalDeposits,
        BigDecimal totalWithdrawals,
        long transactionCount,
        Instant mostRecentTransactionDate
) {
}
