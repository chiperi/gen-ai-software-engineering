package com.example.banking.exception;

/**
 * Thrown for semantically invalid request parameters (e.g. a non-positive day count).
 * Mapped to HTTP 400 by the global handler.
 */
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}
