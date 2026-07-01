package com.example.banking.service;

import com.example.banking.exception.InvalidRequestException;
import com.example.banking.web.dto.InterestResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Computes simple interest on an account's current balance (Task 4B):
 * {@code interest = balance * rate * (days / 365)}, rounded to 2 decimal places.
 */
@Service
public class InterestService {

    private static final BigDecimal DAYS_IN_YEAR = BigDecimal.valueOf(365);

    private final BalanceService balanceService;

    public InterestService(BalanceService balanceService) {
        this.balanceService = balanceService;
    }

    public InterestResponse calculate(String accountId, BigDecimal rate, long days) {
        if (rate == null || rate.signum() < 0) {
            throw new InvalidRequestException("rate must be zero or positive");
        }
        if (days <= 0) {
            throw new InvalidRequestException("days must be a positive integer");
        }

        BigDecimal balance = balanceService.balanceOf(accountId);
        BigDecimal interest = balance
                .multiply(rate)
                .multiply(BigDecimal.valueOf(days))
                .divide(DAYS_IN_YEAR, 2, RoundingMode.HALF_UP);

        return new InterestResponse(accountId, balance, rate, days, interest);
    }
}
