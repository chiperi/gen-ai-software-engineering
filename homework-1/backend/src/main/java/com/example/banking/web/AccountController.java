package com.example.banking.web;

import com.example.banking.service.BalanceService;
import com.example.banking.service.InterestService;
import com.example.banking.service.SummaryService;
import com.example.banking.web.dto.InterestResponse;
import com.example.banking.web.dto.SummaryResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Account-level read endpoints: balance, summary, and simple interest.
 */
@RestController
@RequestMapping("/accounts")
public class AccountController {

    private final BalanceService balanceService;
    private final SummaryService summaryService;
    private final InterestService interestService;

    public AccountController(BalanceService balanceService,
                            SummaryService summaryService,
                            InterestService interestService) {
        this.balanceService = balanceService;
        this.summaryService = summaryService;
        this.interestService = interestService;
    }

    @GetMapping("/{accountId}/balance")
    public Map<String, Object> balance(@PathVariable String accountId) {
        BigDecimal balance = balanceService.balanceOf(accountId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("accountId", accountId);
        body.put("balance", balance);
        return body;
    }

    @GetMapping("/{accountId}/summary")
    public SummaryResponse summary(@PathVariable String accountId) {
        return summaryService.summarize(accountId);
    }

    @GetMapping("/{accountId}/interest")
    public InterestResponse interest(@PathVariable String accountId,
                                     @RequestParam BigDecimal rate,
                                     @RequestParam long days) {
        return interestService.calculate(accountId, rate, days);
    }
}
