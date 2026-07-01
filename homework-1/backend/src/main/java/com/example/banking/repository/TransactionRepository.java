package com.example.banking.repository;

import com.example.banking.model.Transaction;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory, thread-safe store for transactions. No database — state lives for the lifetime
 * of the process.
 */
@Repository
public class TransactionRepository {

    private final Map<String, Transaction> store = new ConcurrentHashMap<>();

    public Transaction save(Transaction transaction) {
        store.put(transaction.id(), transaction);
        return transaction;
    }

    public List<Transaction> findAll() {
        return new ArrayList<>(store.values());
    }

    public Optional<Transaction> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    /** Remove all transactions. Used to isolate tests. */
    public void clear() {
        store.clear();
    }
}
