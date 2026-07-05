package com.example.banking.web;

import com.example.banking.model.Transaction;
import com.example.banking.model.TransactionStatus;
import com.example.banking.model.TransactionType;
import com.example.banking.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cycle 4 — filtering on GET /transactions. Data is seeded directly into the repository so
 * timestamps and types are deterministic.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TransactionFilterTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TransactionRepository repository;

    @BeforeEach
    void seedData() {
        repository.clear();
        seed("ACC-A", "ACC-B", TransactionType.TRANSFER, "2024-01-10T12:00:00Z");   // t1
        seed("ACC-C", "ACC-A", TransactionType.DEPOSIT, "2024-01-20T12:00:00Z");    // t2
        seed("ACC-A", "ACC-D", TransactionType.WITHDRAWAL, "2024-02-15T12:00:00Z"); // t3
        seed("ACC-X", "ACC-Y", TransactionType.TRANSFER, "2024-01-25T12:00:00Z");   // t4
    }

    private void seed(String from, String to, TransactionType type, String instant) {
        repository.save(new Transaction(
                UUID.randomUUID().toString(), from, to, new BigDecimal("10.00"),
                "USD", type, Instant.parse(instant), TransactionStatus.COMPLETED));
    }

    @Test
    @DisplayName("Filter by accountId matches transactions where it is the from OR the to account")
    void list_filterByAccountId_matchesFromOrTo() throws Exception {
        mockMvc.perform(get("/transactions").param("accountId", "ACC-A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3)); // t1 (from), t2 (to), t3 (from)
    }

    @Test
    @DisplayName("Filter by type returns only transactions of that type")
    void list_filterByType_returnsOnlyThatType() throws Exception {
        mockMvc.perform(get("/transactions").param("type", "transfer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2)) // t1, t4
                .andExpect(jsonPath("$[*].type", everyItem(equalTo("transfer"))));
    }

    @Test
    @DisplayName("Filter by date range is inclusive on both bounds")
    void list_filterByDateRange_inclusiveBounds() throws Exception {
        mockMvc.perform(get("/transactions")
                        .param("from", "2024-01-10")
                        .param("to", "2024-01-25"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3)); // t1 (10th), t2 (20th), t4 (25th); t3 excluded
    }

    @Test
    @DisplayName("Combined filters are applied together (AND)")
    void list_combinedFilters_appliesAllAsAnd() throws Exception {
        mockMvc.perform(get("/transactions")
                        .param("accountId", "ACC-A")
                        .param("type", "transfer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1)) // only t1
                .andExpect(jsonPath("$[0].fromAccount").value("ACC-A"))
                .andExpect(jsonPath("$[0].toAccount").value("ACC-B"))
                .andExpect(jsonPath("$[0].type").value("transfer"));
    }

    @Test
    @DisplayName("Filters with no matches return an empty array")
    void list_noMatches_returnsEmptyArray() throws Exception {
        mockMvc.perform(get("/transactions").param("accountId", "ACC-NONE"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }
}
