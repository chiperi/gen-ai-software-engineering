package com.example.banking.validation;

import com.example.banking.web.dto.TransactionRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Cycle 2 — unit tests for the Bean Validation constraints on {@link TransactionRequest},
 * exercised directly through a {@link Validator} (no Spring context).
 */
class TransactionRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    private Set<String> invalidFields(TransactionRequest request) {
        return validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());
    }

    private TransactionRequest valid() {
        return new TransactionRequest("ACC-12345", "ACC-67890", new BigDecimal("100.50"), "USD", "transfer");
    }

    @Test
    @DisplayName("A fully valid request has no violations")
    void validRequest_hasNoViolations() {
        assertThat(validator.validate(valid())).isEmpty();
    }

    @Test
    @DisplayName("Negative amount violates the amount constraint")
    void negativeAmount_violatesAmount() {
        var request = new TransactionRequest("ACC-12345", "ACC-67890", new BigDecimal("-5"), "USD", "transfer");
        assertThat(invalidFields(request)).contains("amount");
    }

    @Test
    @DisplayName("More than two decimal places violates the amount constraint")
    void tooManyDecimals_violatesAmount() {
        var request = new TransactionRequest("ACC-12345", "ACC-67890", new BigDecimal("100.555"), "USD", "transfer");
        assertThat(invalidFields(request)).contains("amount");
    }

    @Test
    @DisplayName("Wrong account format violates the fromAccount constraint")
    void badAccountFormat_violatesFromAccount() {
        var request = new TransactionRequest("12345", "ACC-67890", new BigDecimal("1.00"), "USD", "transfer");
        assertThat(invalidFields(request)).contains("fromAccount");
    }

    @Test
    @DisplayName("Unknown and lowercase currencies violate the currency constraint")
    void invalidCurrency_violatesCurrency() {
        var unknown = new TransactionRequest("ACC-12345", "ACC-67890", new BigDecimal("1.00"), "XYZ", "transfer");
        var lowercase = new TransactionRequest("ACC-12345", "ACC-67890", new BigDecimal("1.00"), "usd", "transfer");
        assertThat(invalidFields(unknown)).contains("currency");
        assertThat(invalidFields(lowercase)).contains("currency");
    }

    @Test
    @DisplayName("Unknown type violates the type constraint")
    void invalidType_violatesType() {
        var request = new TransactionRequest("ACC-12345", "ACC-67890", new BigDecimal("1.00"), "USD", "gift");
        assertThat(invalidFields(request)).contains("type");
    }
}
