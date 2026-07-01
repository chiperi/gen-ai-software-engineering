package com.example.banking.model;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Lifecycle status of a transaction. Serialized to JSON in lowercase.
 */
public enum TransactionStatus {
    PENDING,
    COMPLETED,
    FAILED;

    @JsonValue
    public String value() {
        return name().toLowerCase();
    }
}
