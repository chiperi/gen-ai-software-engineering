package com.example.banking.model;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Type of a banking transaction. Serialized to JSON in lowercase (deposit/withdrawal/transfer).
 */
public enum TransactionType {
    DEPOSIT,
    WITHDRAWAL,
    TRANSFER;

    /** JSON representation, e.g. {@code "transfer"}. */
    @JsonValue
    public String value() {
        return name().toLowerCase();
    }

    /** Parse from the JSON/string form (case-insensitive). Throws if unknown. */
    public static TransactionType fromValue(String raw) {
        return TransactionType.valueOf(raw.trim().toUpperCase());
    }
}
