package com.example.banking.web;

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
 * Cycle 3 — web-layer tests for the balance endpoint.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TransactionRepository repository;

    @BeforeEach
    void resetState() {
        repository.clear();
    }

    private void createTransaction(String from, String to, String amount, String type) throws Exception {
        mockMvc.perform(post("/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fromAccount":"%s","toAccount":"%s","amount":%s,"currency":"USD","type":"%s"}
                                """.formatted(from, to, amount, type)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("GET /accounts/{id}/balance returns 200 with the computed balance")
    void getBalance_existingAccount_returns200WithComputedBalance() throws Exception {
        createTransaction("ACC-00000", "ACC-12345", "200.00", "deposit");    // +200.00 to ACC-12345
        createTransaction("ACC-12345", "ACC-00000", "50.00", "withdrawal");  // -50.00 from ACC-12345

        mockMvc.perform(get("/accounts/ACC-12345/balance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountId").value("ACC-12345"))
                .andExpect(jsonPath("$.balance").value(150.00));
    }

    @Test
    @DisplayName("GET /accounts/{id}/balance returns zero for an account with no transactions")
    void getBalance_unknownAccount_returnsZero() throws Exception {
        mockMvc.perform(get("/accounts/ACC-99999/balance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountId").value("ACC-99999"))
                .andExpect(jsonPath("$.balance").value(0));
    }

    @Test
    @DisplayName("GET /accounts/{id}/summary returns totals, count and most recent date")
    void getSummary_returnsAggregates() throws Exception {
        createTransaction("ACC-00000", "ACC-12345", "200.00", "deposit");
        createTransaction("ACC-00000", "ACC-12345", "50.00", "deposit");
        createTransaction("ACC-12345", "ACC-00000", "30.00", "withdrawal");

        mockMvc.perform(get("/accounts/ACC-12345/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDeposits").value(250.00))
                .andExpect(jsonPath("$.totalWithdrawals").value(30.00))
                .andExpect(jsonPath("$.transactionCount").value(3))
                .andExpect(jsonPath("$.mostRecentTransactionDate").isNotEmpty());
    }

    @Test
    @DisplayName("GET /accounts/{id}/summary returns zeros and a null date for an empty account")
    void getSummary_emptyAccount_returnsZeros() throws Exception {
        mockMvc.perform(get("/accounts/ACC-99999/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDeposits").value(0))
                .andExpect(jsonPath("$.totalWithdrawals").value(0))
                .andExpect(jsonPath("$.transactionCount").value(0))
                .andExpect(jsonPath("$.mostRecentTransactionDate").isEmpty());
    }

    @Test
    @DisplayName("GET /accounts/{id}/interest returns the inputs and the computed interest")
    void getInterest_returnsInputsAndResult() throws Exception {
        createTransaction("ACC-00000", "ACC-12345", "1000.00", "deposit");

        mockMvc.perform(get("/accounts/ACC-12345/interest")
                        .param("rate", "0.05")
                        .param("days", "365"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountId").value("ACC-12345"))
                .andExpect(jsonPath("$.balance").value(1000.00))
                .andExpect(jsonPath("$.rate").value(0.05))
                .andExpect(jsonPath("$.days").value(365))
                .andExpect(jsonPath("$.interest").value(50.00));
    }

    @Test
    @DisplayName("GET /accounts/{id}/interest returns 400 when a required parameter is missing")
    void getInterest_missingParam_returns400() throws Exception {
        mockMvc.perform(get("/accounts/ACC-12345/interest").param("days", "30"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /accounts/{id}/interest returns 400 for a non-positive day count")
    void getInterest_nonPositiveDays_returns400() throws Exception {
        mockMvc.perform(get("/accounts/ACC-12345/interest")
                        .param("rate", "0.05")
                        .param("days", "-5"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad request"));
    }
}
