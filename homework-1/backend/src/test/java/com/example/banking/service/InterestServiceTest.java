package com.example.banking.service;

import com.example.banking.exception.InvalidRequestException;
import com.example.banking.model.Transaction;
import com.example.banking.model.TransactionStatus;
import com.example.banking.model.TransactionType;
import com.example.banking.repository.TransactionRepository;
import com.example.banking.web.dto.InterestResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Cycle 6 — unit tests for {@link InterestService}.
 */
class InterestServiceTest {

    private TransactionRepository repository;
    private InterestService service;

    @BeforeEach
    void setUp() {
        repository = new TransactionRepository();
        service = new InterestService(new BalanceService(repository));
    }

    private void deposit(String account, String amount) {
        repository.save(new Transaction(
                UUID.randomUUID().toString(), "ACC-00000", account, new BigDecimal(amount),
                "USD", TransactionType.DEPOSIT, Instant.now(), TransactionStatus.COMPLETED));
    }

    @Test
    @DisplayName("interest = balance * rate * days / 365")
    void interest_isBalanceTimesRateTimesDaysOver365() {
        deposit("ACC-11111", "1000.00");

        InterestResponse fullYear = service.calculate("ACC-11111", new BigDecimal("0.05"), 365);
        assertThat(fullYear.interest()).isEqualByComparingTo("50.00");
        assertThat(fullYear.balance()).isEqualByComparingTo("1000.00");

        InterestResponse thirtyDays = service.calculate("ACC-11111", new BigDecimal("0.05"), 30);
        // 1000 * 0.05 * 30 / 365 = 4.1095... -> 4.11 (HALF_UP, 2dp)
        assertThat(thirtyDays.interest()).isEqualByComparingTo("4.11");
    }

    @Test
    @DisplayName("Zero balance yields zero interest")
    void interest_zeroBalance_returnsZero() {
        InterestResponse response = service.calculate("ACC-EMPTY", new BigDecimal("0.05"), 365);
        assertThat(response.interest()).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("Non-positive days are rejected")
    void interest_nonPositiveDays_throws() {
        assertThatThrownBy(() -> service.calculate("ACC-11111", new BigDecimal("0.05"), 0))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    @DisplayName("Negative rate is rejected")
    void interest_negativeRate_throws() {
        assertThatThrownBy(() -> service.calculate("ACC-11111", new BigDecimal("-0.01"), 30))
                .isInstanceOf(InvalidRequestException.class);
    }
}
