package com.example.banking.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI metadata for the generated spec at {@code /v3/api-docs}, which is rendered as a
 * modern API reference by Scalar at {@code /docs}.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI bankingOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Banking Transactions API")
                .version("v1")
                .description("REST API for banking transactions (Homework 1) — "
                        + "create and list transactions, filter history, check balances, "
                        + "account summaries, simple interest, and CSV export."));
    }
}
