package com.example.banking.service;

import com.example.banking.model.Transaction;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Serializes transactions to CSV (Task 4C), following RFC 4180 quoting for any field that
 * contains a comma, quote, or newline.
 */
@Component
public class CsvExporter {

    public static final String HEADER =
            "id,fromAccount,toAccount,amount,currency,type,timestamp,status";

    public String toCsv(List<Transaction> transactions) {
        StringBuilder sb = new StringBuilder(HEADER);
        for (Transaction t : transactions) {
            sb.append('\n')
                    .append(escape(t.id())).append(',')
                    .append(escape(t.fromAccount())).append(',')
                    .append(escape(t.toAccount())).append(',')
                    .append(t.amount().toPlainString()).append(',')
                    .append(escape(t.currency())).append(',')
                    .append(t.type().value()).append(',')
                    .append(t.timestamp().toString()).append(',')
                    .append(t.status().value());
        }
        return sb.toString();
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
