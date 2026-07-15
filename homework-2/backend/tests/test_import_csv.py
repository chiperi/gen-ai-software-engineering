"""CSV import tests (Task 3 — 6 tests)."""

from __future__ import annotations

from app.importers import detect_format, parse_and_validate, parse_csv
from tests.conftest import fixture_bytes


def test_parse_csv_returns_rows():
    rows = parse_csv(fixture_bytes("valid_tickets.csv"))
    assert len(rows) == 3
    assert rows[0]["customer_id"] == "CUST-100"


def test_csv_tags_split_into_list():
    rows = parse_csv(fixture_bytes("valid_tickets.csv"))
    assert rows[0]["tags"] == ["login", "urgent"]


def test_csv_metadata_columns_nested():
    rows = parse_csv(fixture_bytes("valid_tickets.csv"))
    assert rows[0]["metadata"]["source"] == "web_form"
    assert rows[0]["metadata"]["device_type"] == "desktop"


def test_csv_all_valid_import(client):
    resp = client.post(
        "/tickets/import",
        files={"file": ("valid_tickets.csv", fixture_bytes("valid_tickets.csv"), "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3
    assert body["successful"] == 3
    assert body["failed"] == 0


def test_csv_partial_failures_reported(client):
    resp = client.post(
        "/tickets/import",
        files={"file": ("invalid_tickets.csv", fixture_bytes("invalid_tickets.csv"), "text/csv")},
    )
    body = resp.json()
    assert body["successful"] == 1
    assert body["failed"] == 2
    assert len(body["errors"]) == 2
    assert "row" in body["errors"][0]


def test_csv_detect_format():
    assert detect_format("data.csv", None) == "csv"
    valid, errors = parse_and_validate(fixture_bytes("valid_tickets.csv"), "csv")
    assert len(valid) == 3 and errors == []
