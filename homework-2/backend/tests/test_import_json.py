"""JSON import tests (Task 3 — 5 tests)."""

from __future__ import annotations

from app.importers import parse_json
from tests.conftest import fixture_bytes


def test_parse_json_returns_rows():
    rows = parse_json(fixture_bytes("valid_tickets.json"))
    assert len(rows) == 2
    assert rows[0]["customer_id"] == "CUST-300"


def test_json_all_valid_import(client):
    resp = client.post(
        "/tickets/import",
        files={"file": ("valid_tickets.json", fixture_bytes("valid_tickets.json"), "application/json")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert body["successful"] == 2
    assert body["failed"] == 0
    assert len(body["created_ids"]) == 2


def test_json_partial_failures(client):
    resp = client.post(
        "/tickets/import",
        files={"file": ("invalid_tickets.json", fixture_bytes("invalid_tickets.json"), "application/json")},
    )
    body = resp.json()
    assert body["successful"] == 1
    assert body["failed"] == 1


def test_json_malformed_returns_400(client):
    resp = client.post(
        "/tickets/import",
        files={"file": ("malformed.json", fixture_bytes("malformed.json"), "application/json")},
    )
    assert resp.status_code == 400
    assert "Malformed JSON" in resp.json()["error"]


def test_json_non_array_rejected(client):
    resp = client.post(
        "/tickets/import?format=json",
        files={"file": ("obj.json", b'{"not": "an array"}', "application/json")},
    )
    assert resp.status_code == 400
