package com.example.banking.web;

import com.example.banking.config.RateLimiter;
import org.junit.jupiter.api.BeforeEach;
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
 * Cycle 8 — rate limiting (Task 4D). Runs in its own context with the filter enabled and a
 * low limit (3) so the 429 path is exercised quickly. The limiter is reset before each test.
 */
@SpringBootTest(properties = {"ratelimit.enabled=true", "ratelimit.limit=3", "ratelimit.window-seconds=60"})
@AutoConfigureMockMvc
class RateLimitTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RateLimiter rateLimiter;

    @BeforeEach
    void resetLimiter() {
        rateLimiter.reset();
    }

    @Test
    @DisplayName("Requests within the limit succeed")
    void withinLimit_requestsSucceed() throws Exception {
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(get("/transactions")).andExpect(status().isOk());
        }
    }

    @Test
    @DisplayName("Exceeding the limit returns 429 with a JSON body")
    void overLimit_returns429WithJsonBody() throws Exception {
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(get("/transactions")).andExpect(status().isOk());
        }

        mockMvc.perform(get("/transactions"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error").value("Too Many Requests"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
