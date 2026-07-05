package com.example.banking.web;

import com.example.banking.exception.InvalidRequestException;
import com.example.banking.exception.TransactionNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Centralized translation of exceptions into HTTP responses.
 * Cycle 1: 404 (not found). Cycle 2: 400 (validation). Rate limiting (429) is handled in
 * its own filter in a later cycle.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(TransactionNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(TransactionNotFoundException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "Transaction not found");
        body.put("id", ex.getId());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidRequest(InvalidRequestException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "Bad request");
        body.put("message", ex.getMessage());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        List<Map<String, String>> details = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> {
                    Map<String, String> detail = new LinkedHashMap<>();
                    detail.put("field", fieldError.getField());
                    detail.put("message", fieldError.getDefaultMessage());
                    return detail;
                })
                .toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "Validation failed");
        body.put("details", details);
        return ResponseEntity.badRequest().body(body);
    }
}
