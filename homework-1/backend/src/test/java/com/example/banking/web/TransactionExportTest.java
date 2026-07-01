package com.example.banking.web;

import com.example.banking.model.Transaction;
import com.example.banking.model.TransactionStatus;
import com.example.banking.model.TransactionType;
import com.example.banking.repository.TransactionRepository;
import com.example.banking.service.CsvExporter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cycle 7 — CSV export (Task 4C).
 */
@SpringBootTest
@AutoConfigureMockMvc
class TransactionExportTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TransactionRepository repository;

    @BeforeEach
    void resetState() {
        repository.clear();
    }

    private void seed(String from, String to, String amount, TransactionType type) {
        repository.save(new Transaction(
                UUID.randomUUID().toString(), from, to, new BigDecimal(amount),
                "USD", type, Instant.parse("2024-01-01T10:00:00Z"), TransactionStatus.COMPLETED));
    }

    @Test
    @DisplayName("Export returns 200 with text/csv and an attachment Content-Disposition")
    void exportCsv_returns200_textCsv_withAttachmentHeader() throws Exception {
        mockMvc.perform(get("/transactions/export").param("format", "csv"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.parseMediaType("text/csv")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment")));
    }

    @Test
    @DisplayName("Export body has a header row plus one line per transaction")
    void exportCsv_bodyHasHeaderRowAndOneLinePerTransaction() throws Exception {
        seed("ACC-00000", "ACC-11111", "100.00", TransactionType.DEPOSIT);
        seed("ACC-11111", "ACC-22222", "25.00", TransactionType.TRANSFER);

        String body = mockMvc.perform(get("/transactions/export").param("format", "csv"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String[] lines = body.split("\n");
        assertThat(lines).hasSize(3); // header + 2 transactions
        assertThat(lines[0]).isEqualTo(CsvExporter.HEADER);
    }

    @Test
    @DisplayName("An unsupported export format returns 400")
    void exportCsv_unsupportedFormat_returns400() throws Exception {
        mockMvc.perform(get("/transactions/export").param("format", "xml"))
                .andExpect(status().isBadRequest());
    }
}
