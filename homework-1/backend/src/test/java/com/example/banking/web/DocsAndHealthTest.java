package com.example.banking.web;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Health endpoint (Actuator) and OpenAPI/Scalar docs wiring.
 */
@SpringBootTest
@AutoConfigureMockMvc
class DocsAndHealthTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /actuator/health returns 200 and status UP")
    void health_returnsUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("GET /v3/api-docs returns the OpenAPI spec with the API title")
    void openApiSpec_isAvailable() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi").exists())
                .andExpect(jsonPath("$.info.title").value("Banking Transactions API"));
    }

    @Test
    @DisplayName("GET /docs redirects to the Scalar reference page")
    void docs_redirectsToReference() throws Exception {
        mockMvc.perform(get("/docs"))
                .andExpect(status().is3xxRedirection());
    }
}
