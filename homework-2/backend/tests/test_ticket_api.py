"""API endpoint tests (Task 3 — 11 tests)."""

from __future__ import annotations


def _create(client, payload) -> dict:
    resp = client.post("/tickets", json=payload)
    assert resp.status_code == 201
    return resp.json()


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_create_ticket_returns_201_with_server_fields(client, valid_ticket_payload):
    body = _create(client, valid_ticket_payload)
    assert body["id"]
    assert body["status"] == "new"
    assert body["created_at"] and body["updated_at"]
    assert body["resolved_at"] is None


def test_create_ticket_invalid_email_returns_400(client, valid_ticket_payload):
    valid_ticket_payload["customer_email"] = "nope"
    resp = client.post("/tickets", json=valid_ticket_payload)
    assert resp.status_code == 400
    assert resp.json()["error"] == "Validation failed"
    assert resp.json()["details"]


def test_list_empty(client):
    resp = client.get("/tickets")
    assert resp.status_code == 200
    assert resp.json() == []


def test_get_ticket_by_id(client, valid_ticket_payload):
    created = _create(client, valid_ticket_payload)
    resp = client.get(f"/tickets/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


def test_get_missing_ticket_returns_404(client):
    resp = client.get("/tickets/does-not-exist")
    assert resp.status_code == 404
    assert "not found" in resp.json()["error"].lower()


def test_update_ticket(client, valid_ticket_payload):
    created = _create(client, valid_ticket_payload)
    resp = client.put(f"/tickets/{created['id']}", json={"assigned_to": "agent-7"})
    assert resp.status_code == 200
    assert resp.json()["assigned_to"] == "agent-7"


def test_update_to_resolved_sets_resolved_at(client, valid_ticket_payload):
    created = _create(client, valid_ticket_payload)
    resp = client.put(f"/tickets/{created['id']}", json={"status": "resolved"})
    assert resp.status_code == 200
    assert resp.json()["resolved_at"] is not None


def test_update_missing_ticket_returns_404(client):
    resp = client.put("/tickets/nope", json={"assigned_to": "x"})
    assert resp.status_code == 404


def test_delete_ticket(client, valid_ticket_payload):
    created = _create(client, valid_ticket_payload)
    resp = client.delete(f"/tickets/{created['id']}")
    assert resp.status_code == 204
    assert client.get(f"/tickets/{created['id']}").status_code == 404


def test_delete_missing_ticket_returns_404(client):
    assert client.delete("/tickets/nope").status_code == 404


def test_list_filters_by_category_priority_status(client, valid_ticket_payload):
    a = dict(valid_ticket_payload, category="billing_question", priority="high")
    b = dict(valid_ticket_payload, category="bug_report", priority="low")
    _create(client, a)
    _create(client, b)
    resp = client.get("/tickets", params={"category": "billing_question", "priority": "high"})
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) == 1
    assert results[0]["category"] == "billing_question"
