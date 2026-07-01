package com.example.banking.exception;

/**
 * Thrown when a transaction id cannot be found. Mapped to HTTP 404 by the global handler.
 */
public class TransactionNotFoundException extends RuntimeException {

    private final String id;

    public TransactionNotFoundException(String id) {
        super("Transaction not found: " + id);
        this.id = id;
    }

    public String getId() {
        return id;
    }
}
