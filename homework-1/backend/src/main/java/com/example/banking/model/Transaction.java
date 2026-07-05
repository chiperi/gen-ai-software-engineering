package com.example.banking.model;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A stored banking transaction. Immutable; {@code id}, {@code timestamp} and {@code status}
 * are assigned by the server at creation time. Money is held as {@link BigDecimal}.
 */
public record Transaction(
        String id,
        String fromAccount,
        String toAccount,
        BigDecimal amount,
        String currency,
        TransactionType type,
        Instant timestamp,
        TransactionStatus status
) {
}
