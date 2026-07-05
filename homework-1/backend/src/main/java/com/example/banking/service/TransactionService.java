package com.example.banking.service;

import com.example.banking.exception.TransactionNotFoundException;
import com.example.banking.model.Transaction;
import com.example.banking.model.TransactionStatus;
import com.example.banking.model.TransactionType;
import com.example.banking.repository.TransactionRepository;
import com.example.banking.web.dto.TransactionRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

/**
 * Application logic for transactions: creation (with server-assigned id/timestamp/status)
 * and retrieval.
 */
@Service
public class TransactionService {

    private final TransactionRepository repository;

    public TransactionService(TransactionRepository repository) {
        this.repository = repository;
    }

    public Transaction create(TransactionRequest request) {
        Transaction transaction = new Transaction(
                UUID.randomUUID().toString(),
                request.fromAccount(),
                request.toAccount(),
                request.amount(),
                request.currency(),
                TransactionType.fromValue(request.type()),
                Instant.now(),
                TransactionStatus.COMPLETED
        );
        return repository.save(transaction);
    }

    public List<Transaction> findAll() {
        return repository.findAll();
    }

    /**
     * Returns transactions matching all of the supplied filters (logical AND). Any filter
     * left {@code null} is ignored. The date range is inclusive on both ends and compares
     * against the transaction timestamp in UTC.
     */
    public List<Transaction> find(String accountId, String type, LocalDate from, LocalDate to) {
        Instant fromInstant = (from == null) ? null : from.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant toExclusive = (to == null) ? null : to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        return repository.findAll().stream()
                .filter(t -> accountId == null
                        || accountId.equals(t.fromAccount()) || accountId.equals(t.toAccount()))
                .filter(t -> type == null || t.type().value().equalsIgnoreCase(type))
                .filter(t -> fromInstant == null || !t.timestamp().isBefore(fromInstant))
                .filter(t -> toExclusive == null || t.timestamp().isBefore(toExclusive))
                .toList();
    }

    public Transaction findById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException(id));
    }
}
