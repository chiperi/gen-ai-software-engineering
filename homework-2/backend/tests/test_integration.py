"""End-to-end integration tests (Task 6 — 5 tests)."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

from tests.conftest import fixture_bytes


def test_full_ticket_lifecycle(client, valid_ticket_payload):
    # create -> classify -> update -> resolve -> delete
    created = client.post("/tickets", json=valid_ticket_payload).json()
    tid = created["id"]

    classified = client.post(f"/tickets/{tid}/auto-classify").json()
    assert classified["classification"] is not None

    client.put(f"/tickets/{tid}", json={"status": "in_progress", "assigned_to": "agent-1"})
    resolved = client.put(f"/tickets/{tid}", json={"status": "resolved"}).json()
    assert resolved["resolved_at"] is not None

    assert client.delete(f"/tickets/{tid}").status_code == 204
    assert client.get(f"/tickets/{tid}").status_code == 404


def test_bulk_import_with_auto_classification(client):
    resp = client.post(
        "/tickets/import?auto_classify=true",
        files={"file": ("valid_tickets.csv", fixture_bytes("valid_tickets.csv"), "text/csv")},
    )
    assert resp.json()["successful"] == 3
    tickets = client.get("/tickets").json()
    assert len(tickets) == 3
    assert all(t["classification"] is not None for t in tickets)


def test_create_with_auto_classify_flag(client, valid_ticket_payload):
    resp = client.post("/tickets?auto_classify=true", json=valid_ticket_payload)
    body = resp.json()
    assert body["classification"] is not None
    assert body["category"] == body["classification"]["category"]


def test_concurrent_creates(client, valid_ticket_payload):
    def create(i: int):
        payload = dict(valid_ticket_payload, customer_id=f"CUST-C{i}")
        return client.post("/tickets", json=payload).status_code

    with ThreadPoolExecutor(max_workers=20) as pool:
        statuses = list(pool.map(create, range(25)))

    assert all(s == 201 for s in statuses)
    assert len(client.get("/tickets").json()) == 25


def test_combined_filtering_after_import(client):
    client.post(
        "/tickets/import?auto_classify=true",
        files={"file": ("valid_tickets.csv", fixture_bytes("valid_tickets.csv"), "text/csv")},
    )
    # First row -> account_access + urgent (production down / 500 / can't access).
    resp = client.get("/tickets", params={"category": "account_access", "priority": "urgent"})
    assert resp.status_code == 200
    assert all(
        t["category"] == "account_access" and t["priority"] == "urgent"
        for t in resp.json()
    )
