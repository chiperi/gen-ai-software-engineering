"""Performance benchmarks (Task 6 — 5 tests).

These assert generous upper bounds so they are stable in CI while still
documenting expected throughput (numbers feed the TESTING_GUIDE table).
"""

from __future__ import annotations

import time

from app.classifier import classify_text
from app.importers import parse_and_validate


def _build_csv(n: int) -> bytes:
    header = "customer_id,customer_email,customer_name,subject,description\n"
    row = (
        "CUST-{i},user{i}@example.com,User {i},Login problem number {i},"
        "I cannot log in and my password reset link keeps failing repeatedly.\n"
    )
    return (header + "".join(row.format(i=i) for i in range(n))).encode()


def test_import_50_rows_under_1s():
    data = _build_csv(50)
    start = time.perf_counter()
    valid, errors = parse_and_validate(data, "csv")
    elapsed = time.perf_counter() - start
    assert len(valid) == 50 and errors == []
    assert elapsed < 1.0


def test_classify_single_fast():
    start = time.perf_counter()
    classify_text("Cannot log in", "password reset 2fa security critical")
    assert time.perf_counter() - start < 0.05


def test_classify_1000_under_2s():
    start = time.perf_counter()
    for _ in range(1000):
        classify_text("billing refund", "invoice payment charge issue")
    assert time.perf_counter() - start < 2.0


def test_create_100_tickets_under_2s(client, valid_ticket_payload):
    start = time.perf_counter()
    for i in range(100):
        client.post("/tickets", json=dict(valid_ticket_payload, customer_id=f"P{i}"))
    assert time.perf_counter() - start < 2.0
    assert len(client.get("/tickets").json()) == 100


def test_list_with_filter_fast(client, valid_ticket_payload):
    for i in range(100):
        client.post("/tickets", json=dict(valid_ticket_payload, customer_id=f"L{i}"))
    start = time.perf_counter()
    client.get("/tickets", params={"category": "other"})
    assert time.perf_counter() - start < 0.5
