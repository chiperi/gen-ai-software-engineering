package com.example.banking;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Cycle 0 — verifies the Spring application context starts.
 */
@SpringBootTest
class BankingApplicationTests {

    @Test
    @DisplayName("Spring context loads successfully")
    void contextLoads() {
        // If the context fails to start, this test fails.
    }
}
