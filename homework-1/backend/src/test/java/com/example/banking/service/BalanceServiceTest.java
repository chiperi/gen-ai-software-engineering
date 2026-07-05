package com.example.banking.service;

import com.example.banking.model.Transaction;
import com.example.banking.model.TransactionStatus;
import com.example.banking.model.TransactionType;
import com.example.banking.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Cycle 3 — unit tests for {@link BalanceService}. Transactions (including non-completed
 * ones) are seeded directly into the repository so balance rules can be verified in isolation.
 */
class BalanceServiceTest {

    private TransactionRepository repository;
    private BalanceService service;

    @BeforeEach
    void setUp() {
        repository = new TransactionRepository();
        service = new BalanceService(repository);
    }

    private void seed(String from, String to, String amount, TransactionType type, TransactionStatus status) {
        repository.save(new Transaction(
                UUID.randomUUID().toString(), from, to, new BigDecimal(amount),
                "USD", type, Instant.now(), status));
    }

    @Test
    @DisplayName("A completed deposit increases the toAccount balance")
    void deposit_increasesToAccount() {
        seed("ACC-00000", "ACC-11111", "100.00", TransactionType.DEPOSIT, TransactionStatus.COMPLETED);
        assertThat(service.balanceOf("ACC-11111")).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("A completed withdrawal decreases the fromAccount balance")
    void withdrawal_decreasesFromAccount() {
        seed("ACC-11111", "ACC-00000", "40.00", TransactionType.WITHDRAWAL, TransactionStatus.COMPLETED);
        assertThat(service.balanceOf("ACC-11111")).isEqualByComparingTo("-40.00");
    }

    @Test
    @DisplayName("A completed transfer moves the amount between accounts")
    void transfer_movesAmount() {
        seed("ACC-11111", "ACC-22222", "30.00", TransactionType.TRANSFER, TransactionStatus.COMPLETED);
        assertThat(service.balanceOf("ACC-11111")).isEqualByComparingTo("-30.00");
        assertThat(service.balanceOf("ACC-22222")).isEqualByComparingTo("30.00");
    }

    @Test
    @DisplayName("Only completed transactions count toward the balance")
    void onlyCompletedTransactionsCount() {
        seed("ACC-00000", "ACC-11111", "100.00", TransactionType.DEPOSIT, TransactionStatus.COMPLETED);
        seed("ACC-00000", "ACC-11111", "999.00", TransactionType.DEPOSIT, TransactionStatus.PENDING);
        seed("ACC-00000", "ACC-11111", "999.00", TransactionType.DEPOSIT, TransactionStatus.FAILED);
        assertThat(service.balanceOf("ACC-11111")).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("An unknown account has a zero balance")
    void unknownAccount_isZero() {
        assertThat(service.balanceOf("ACC-NONE")).isEqualByComparingTo("0");
    }
}
