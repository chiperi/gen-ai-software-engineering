package com.example.banking.service;

import com.example.banking.model.Transaction;
import com.example.banking.model.TransactionStatus;
import com.example.banking.model.TransactionType;
import com.example.banking.repository.TransactionRepository;
import com.example.banking.web.dto.SummaryResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Produces an account activity summary (Task 4A): total completed deposits and withdrawals,
 * the number of transactions involving the account, and the most recent transaction date.
 */
@Service
public class SummaryService {

    private final TransactionRepository repository;

    public SummaryService(TransactionRepository repository) {
        this.repository = repository;
    }

    public SummaryResponse summarize(String accountId) {
        BigDecimal totalDeposits = BigDecimal.ZERO;
        BigDecimal totalWithdrawals = BigDecimal.ZERO;
        long transactionCount = 0;
        Instant mostRecent = null;

        for (Transaction transaction : repository.findAll()) {
            boolean involvesAccount = accountId.equals(transaction.fromAccount())
                    || accountId.equals(transaction.toAccount());
            if (!involvesAccount) {
                continue;
            }

            transactionCount++;
            if (mostRecent == null || transaction.timestamp().isAfter(mostRecent)) {
                mostRecent = transaction.timestamp();
            }

            if (transaction.status() == TransactionStatus.COMPLETED) {
                if (transaction.type() == TransactionType.DEPOSIT
                        && accountId.equals(transaction.toAccount())) {
                    totalDeposits = totalDeposits.add(transaction.amount());
                } else if (transaction.type() == TransactionType.WITHDRAWAL
                        && accountId.equals(transaction.fromAccount())) {
                    totalWithdrawals = totalWithdrawals.add(transaction.amount());
                }
            }
        }

        return new SummaryResponse(totalDeposits, totalWithdrawals, transactionCount, mostRecent);
    }
}
