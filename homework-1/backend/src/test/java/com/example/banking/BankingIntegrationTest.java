package com.example.banking;

import com.example.banking.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cycle 9 — end-to-end integration test. Exercises a realistic flow through the running
 * application and checks that balance, summary, and filtering stay mutually consistent.
 */
@SpringBootTest
@AutoConfigureMockMvc
class BankingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TransactionRepository repository;

    @BeforeEach
    void resetState() {
        repository.clear();
    }

    private void create(String from, String to, String amount, String type) throws Exception {
        mockMvc.perform(post("/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fromAccount":"%s","toAccount":"%s","amount":%s,"currency":"USD","type":"%s"}
                                """.formatted(from, to, amount, type)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("create -> balance -> summary -> filters stay consistent")
    void endToEnd_create_balance_summary_consistent() throws Exception {
        create("ACC-000", "ACC-100", "500.00", "deposit");   // +500 to ACC-100
        create("ACC-100", "ACC-200", "200.00", "transfer");  // -200 ACC-100, +200 ACC-200

        // Balances
        mockMvc.perform(get("/accounts/ACC-100/balance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(300.00));
        mockMvc.perform(get("/accounts/ACC-200/balance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(200.00));

        // Summary for ACC-100: one deposit in, one transfer out (a transfer is not a withdrawal)
        mockMvc.perform(get("/accounts/ACC-100/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDeposits").value(500.00))
                .andExpect(jsonPath("$.totalWithdrawals").value(0))
                .andExpect(jsonPath("$.transactionCount").value(2))
                .andExpect(jsonPath("$.mostRecentTransactionDate").isNotEmpty());

        // Filters
        mockMvc.perform(get("/transactions").param("accountId", "ACC-100"))
                .andExpect(jsonPath("$.length()").value(2));
        mockMvc.perform(get("/transactions").param("type", "transfer"))
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/transactions"))
                .andExpect(jsonPath("$.length()").value(2));
    }
}
