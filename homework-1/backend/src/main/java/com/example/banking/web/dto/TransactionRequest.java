package com.example.banking.web.dto;

import com.example.banking.validation.ValidCurrency;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/**
 * Incoming payload for creating a transaction. Currency and type are kept as Strings so that
 * validation produces structured, per-field error messages instead of failing during JSON
 * deserialization. Constraints are checked via {@code @Valid} in the controller.
 */
public record TransactionRequest(

        @NotBlank(message = "fromAccount is required")
        @Pattern(regexp = "^ACC-[A-Za-z0-9]+$",
                message = "Account number must match the format ACC-XXXXX")
        String fromAccount,

        @NotBlank(message = "toAccount is required")
        @Pattern(regexp = "^ACC-[A-Za-z0-9]+$",
                message = "Account number must match the format ACC-XXXXX")
        String toAccount,

        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be a positive number")
        @Digits(integer = 19, fraction = 2, message = "Amount must have at most 2 decimal places")
        BigDecimal amount,

        @NotBlank(message = "Currency is required")
        @ValidCurrency(message = "Invalid currency code")
        String currency,

        @NotBlank(message = "Type is required")
        @Pattern(regexp = "deposit|withdrawal|transfer",
                message = "Type must be one of: deposit, withdrawal, transfer")
        String type
) {
}
