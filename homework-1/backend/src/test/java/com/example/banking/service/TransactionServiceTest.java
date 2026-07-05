package com.example.banking.service;

import com.example.banking.exception.TransactionNotFoundException;
import com.example.banking.model.Transaction;
import com.example.banking.model.TransactionStatus;
import com.example.banking.model.TransactionType;
import com.example.banking.repository.TransactionRepository;
import com.example.banking.web.dto.TransactionRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Cycle 1 — unit tests for {@link TransactionService} (no Spring context).
 */
class TransactionServiceTest {

    private TransactionService service;

    @BeforeEach
    void setUp() {
        service = new TransactionService(new TransactionRepository());
    }

    @Test
    @DisplayName("create() assigns a UUID, a timestamp, and COMPLETED status, and maps the type")
    void create_assignsGeneratedFields() {
        TransactionRequest request = new TransactionRequest(
                "ACC-12345", "ACC-67890", new BigDecimal("100.50"), "USD", "transfer");

        Transaction created = service.create(request);

        assertThat(created.id()).isNotBlank();
        assertThat(created.timestamp()).isNotNull();
        assertThat(created.status()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(created.type()).isEqualTo(TransactionType.TRANSFER);
        assertThat(created.amount()).isEqualByComparingTo("100.50");
        assertThat(created.fromAccount()).isEqualTo("ACC-12345");
    }

    @Test
    @DisplayName("findById() returns the stored transaction")
    void findById_existing_returnsTransaction() {
        Transaction created = service.create(new TransactionRequest(
                "ACC-11111", "ACC-22222", new BigDecimal("10.00"), "EUR", "deposit"));

        Transaction found = service.findById(created.id());

        assertThat(found).isEqualTo(created);
    }

    @Test
    @DisplayName("findById() throws TransactionNotFoundException for an unknown id")
    void findById_unknown_throws() {
        assertThatThrownBy(() -> service.findById("nope"))
                .isInstanceOf(TransactionNotFoundException.class);
    }
}
