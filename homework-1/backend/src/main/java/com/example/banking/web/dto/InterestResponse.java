package com.example.banking.web.dto;

import java.math.BigDecimal;

/**
 * Simple-interest calculation result (Task 4B). Echoes the inputs alongside the computed
 * interest so the response is self-describing.
 */
public record InterestResponse(
        String accountId,
        BigDecimal balance,
        BigDecimal rate,
        long days,
        BigDecimal interest
) {
}
