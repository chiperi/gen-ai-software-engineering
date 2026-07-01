package com.example.banking.service;

import com.example.banking.model.Transaction;
import com.example.banking.model.TransactionStatus;
import com.example.banking.model.TransactionType;
import com.example.banking.repository.TransactionRepository;
import com.example.banking.web.dto.SummaryResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Cycle 5 — unit tests for {@link SummaryService}.
 */
class SummaryServiceTest {

    private TransactionRepository repository;
    private SummaryService service;

    @BeforeEach
    void setUp() {
        repository = new TransactionRepository();
        service = new SummaryService(repository);
    }

    private void seed(String from, String to, String amount, TransactionType type, String instant) {
        repository.save(new Transaction(
                UUID.randomUUID().toString(), from, to, new BigDecimal(amount),
                "USD", type, Instant.parse(instant), TransactionStatus.COMPLETED));
    }

    @Test
    @DisplayName("summarize() returns totals, the count, and the most recent date")
    void summary_returnsTotalsCountAndMostRecentDate() {
        seed("ACC-00000", "ACC-11111", "200.00", TransactionType.DEPOSIT, "2024-01-01T10:00:00Z");
        seed("ACC-00000", "ACC-11111", "50.00", TransactionType.DEPOSIT, "2024-01-02T10:00:00Z");
        seed("ACC-11111", "ACC-00000", "30.00", TransactionType.WITHDRAWAL, "2024-01-03T10:00:00Z");
        seed("ACC-11111", "ACC-22222", "10.00", TransactionType.TRANSFER, "2024-01-04T10:00:00Z");

        SummaryResponse summary = service.summarize("ACC-11111");

        assertThat(summary.totalDeposits()).isEqualByComparingTo("250.00");
        assertThat(summary.totalWithdrawals()).isEqualByComparingTo("30.00");
        assertThat(summary.transactionCount()).isEqualTo(4);
        assertThat(summary.mostRecentTransactionDate()).isEqualTo(Instant.parse("2024-01-04T10:00:00Z"));
    }

    @Test
    @DisplayName("summarize() of an account with no transactions returns zeros and a null date")
    void summary_emptyAccount_returnsZerosAndNullDate() {
        SummaryResponse summary = service.summarize("ACC-NONE");

        assertThat(summary.totalDeposits()).isEqualByComparingTo("0");
        assertThat(summary.totalWithdrawals()).isEqualByComparingTo("0");
        assertThat(summary.transactionCount()).isZero();
        assertThat(summary.mostRecentTransactionDate()).isNull();
    }
}
