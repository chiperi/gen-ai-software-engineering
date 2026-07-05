package com.example.banking.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.Currency;

/**
 * Backs {@link ValidCurrency}. Uses {@link java.util.Currency} so every real ISO 4217 code
 * is accepted and anything else (unknown codes, lowercase, wrong length) is rejected.
 */
public class CurrencyValidator implements ConstraintValidator<ValidCurrency, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true; // emptiness is reported by @NotBlank
        }
        try {
            Currency.getInstance(value);
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
