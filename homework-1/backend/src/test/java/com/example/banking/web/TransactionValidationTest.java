package com.example.banking.web;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cycle 2 — validation and structured error responses for POST /transactions.
 * The error body shape matches PROMPT.md: {@code {"error":"Validation failed","details":[{field,message}]}}.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TransactionValidationTest {

    @Autowired
    private MockMvc mockMvc;

    private String body(String fromAccount, String toAccount, String amount, String currency, String type) {
        return """
                {"fromAccount":"%s","toAccount":"%s","amount":%s,"currency":"%s","type":"%s"}
                """.formatted(fromAccount, toAccount, amount, currency, type);
    }

    @Test
    @DisplayName("Negative amount returns 400 with a field error on amount")
    void createTransaction_negativeAmount_returns400() throws Exception {
        mockMvc.perform(post("/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("ACC-12345", "ACC-67890", "-5", "USD", "transfer")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.details[0].field").value("amount"))
                .andExpect(jsonPath("$.details[0].message").value("Amount must be a positive number"));
    }

    @Test
    @DisplayName("Amount with more than two decimals returns 400 with a field error on amount")
    void createTransaction_amountMoreThanTwoDecimals_returns400() throws Exception {
        mockMvc.perform(post("/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("ACC-12345", "ACC-67890", "100.555", "USD", "transfer")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details[0].field").value("amount"))
                .andExpect(jsonPath("$.details[0].message").value("Amount must have at most 2 decimal places"));
    }

    @Test
    @DisplayName("Bad account format returns 400 with a field error on fromAccount")
    void createTransaction_badAccountFormat_returns400() throws Exception {
        mockMvc.perform(post("/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("12345", "ACC-67890", "100.00", "USD", "transfer")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details[0].field").value("fromAccount"));
    }

    @Test
    @DisplayName("Invalid currency returns 400 with a field error on currency")
    void createTransaction_invalidCurrency_returns400() throws Exception {
        mockMvc.perform(post("/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("ACC-12345", "ACC-67890", "100.00", "XYZ", "transfer")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details[0].field").value("currency"))
                .andExpect(jsonPath("$.details[0].message").value("Invalid currency code"));
    }

    @Test
    @DisplayName("Invalid type returns 400 with a field error on type")
    void createTransaction_invalidType_returns400() throws Exception {
        mockMvc.perform(post("/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("ACC-12345", "ACC-67890", "100.00", "USD", "gift")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details[0].field").value("type"));
    }

    @Test
    @DisplayName("Multiple invalid fields return 400 with one detail entry per broken field")
    void createTransaction_multipleErrors_returnsAllDetails() throws Exception {
        mockMvc.perform(post("/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("ACC-12345", "ACC-67890", "-5", "XYZ", "transfer")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.details.length()").value(2))
                .andExpect(jsonPath("$.details[?(@.field=='amount')]").exists())
                .andExpect(jsonPath("$.details[?(@.field=='currency')]").exists());
    }
}
