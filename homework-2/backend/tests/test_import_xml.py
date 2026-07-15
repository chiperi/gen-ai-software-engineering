"""XML import tests (Task 3 — 5 tests)."""

from __future__ import annotations

from app.importers import parse_xml
from tests.conftest import fixture_bytes


def test_parse_xml_returns_rows():
    rows = parse_xml(fixture_bytes("valid_tickets.xml"))
    assert len(rows) == 2
    assert rows[0]["customer_id"] == "CUST-500"


def test_xml_nested_tags_and_metadata():
    rows = parse_xml(fixture_bytes("valid_tickets.xml"))
    assert rows[0]["tags"] == ["bug", "checkout"]
    assert rows[0]["metadata"]["source"] == "web_form"
    # Second ticket uses a comma-delimited <tags> string.
    assert rows[1]["tags"] == ["cosmetic"]


def test_xml_all_valid_import(client):
    resp = client.post(
        "/tickets/import",
        files={"file": ("valid_tickets.xml", fixture_bytes("valid_tickets.xml"), "application/xml")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert body["successful"] == 2
    assert body["failed"] == 0


def test_xml_partial_failures(client):
    resp = client.post(
        "/tickets/import",
        files={"file": ("invalid_tickets.xml", fixture_bytes("invalid_tickets.xml"), "application/xml")},
    )
    body = resp.json()
    assert body["successful"] == 1
    assert body["failed"] == 1


def test_xml_malformed_returns_400(client):
    resp = client.post(
        "/tickets/import",
        files={"file": ("malformed.xml", fixture_bytes("malformed.xml"), "application/xml")},
    )
    assert resp.status_code == 400
    assert "Malformed XML" in resp.json()["error"]
