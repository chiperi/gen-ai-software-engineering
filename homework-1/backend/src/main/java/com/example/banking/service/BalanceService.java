package com.example.banking.service;

import com.example.banking.model.Transaction;
import com.example.banking.model.TransactionStatus;
import com.example.banking.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Computes account balances from the stored transactions. Only {@code completed}
 * transactions count:
 * <ul>
 *   <li>deposit  → increases the balance of {@code toAccount}</li>
 *   <li>withdrawal → decreases the balance of {@code fromAccount}</li>
 *   <li>transfer → decreases {@code fromAccount} and increases {@code toAccount}</li>
 * </ul>
 */
@Service
public class BalanceService {

    private final TransactionRepository repository;

    public BalanceService(TransactionRepository repository) {
        this.repository = repository;
    }

    public BigDecimal balanceOf(String accountId) {
        BigDecimal balance = BigDecimal.ZERO;
        for (Transaction transaction : repository.findAll()) {
            if (transaction.status() != TransactionStatus.COMPLETED) {
                continue;
            }
            switch (transaction.type()) {
                case DEPOSIT -> {
                    if (accountId.equals(transaction.toAccount())) {
                        balance = balance.add(transaction.amount());
                    }
                }
                case WITHDRAWAL -> {
                    if (accountId.equals(transaction.fromAccount())) {
                        balance = balance.subtract(transaction.amount());
                    }
                }
                case TRANSFER -> {
                    if (accountId.equals(transaction.fromAccount())) {
                        balance = balance.subtract(transaction.amount());
                    }
                    if (accountId.equals(transaction.toAccount())) {
                        balance = balance.add(transaction.amount());
                    }
                }
            }
        }
        return balance;
    }
}
