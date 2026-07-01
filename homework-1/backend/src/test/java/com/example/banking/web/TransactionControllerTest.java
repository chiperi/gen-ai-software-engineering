package com.example.banking.web;

import com.example.banking.repository.TransactionRepository;
import com.jayway.jsonpath.JsonPath;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web-layer tests for {@link TransactionController} (Cycles 0–1).
 * The in-memory repository is cleared before each test for isolation.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TransactionControllerTest {

    private static final String VALID_BODY = """
            {
              "fromAccount": "ACC-12345",
              "toAccount": "ACC-67890",
              "amount": 100.50,
              "currency": "USD",
              "type": "transfer"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TransactionRepository repository;

    @BeforeEach
    void resetState() {
        repository.clear();
    }

    @Test
    @DisplayName("GET /transactions returns 200 and an empty array when there are no transactions")
    void getTransactions_whenEmpty_returns200AndEmptyArray() throws Exception {
        mockMvc.perform(get("/transactions"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    @DisplayName("POST /transactions with a valid body returns 201 with server-generated fields")
    void createTransaction_validBody_returns201WithGeneratedFields() throws Exception {
        mockMvc.perform(post("/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.fromAccount").value("ACC-12345"))
                .andExpect(jsonPath("$.toAccount").value("ACC-67890"))
                .andExpect(jsonPath("$.amount").value(100.50))
                .andExpect(jsonPath("$.currency").value("USD"))
                .andExpect(jsonPath("$.type").value("transfer"))
                .andExpect(jsonPath("$.status").value("completed"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    @DisplayName("GET /transactions after a create returns a list containing the new transaction")
    void getTransactions_afterCreate_returnsListWithIt() throws Exception {
        mockMvc.perform(post("/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].fromAccount").value("ACC-12345"))
                .andExpect(jsonPath("$[0].type").value("transfer"));
    }

    @Test
    @DisplayName("GET /transactions/{id} returns 200 with the transaction when it exists")
    void getTransactionById_existing_returns200WithTransaction() throws Exception {
        String response = mockMvc.perform(post("/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String id = JsonPath.read(response, "$.id");

        mockMvc.perform(get("/transactions/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.toAccount").value("ACC-67890"));
    }

    @Test
    @DisplayName("GET /transactions/{id} returns 404 with {error, id} when the id is unknown")
    void getTransactionById_unknown_returns404() throws Exception {
        mockMvc.perform(get("/transactions/does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Transaction not found"))
                .andExpect(jsonPath("$.id").value("does-not-exist"));
    }
}
