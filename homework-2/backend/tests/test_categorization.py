"""Auto-classification tests (Task 3 — 10 tests)."""

from __future__ import annotations

from app.classifier import classify_text
from app.models import Category, Priority


def test_account_access_category():
    c = classify_text("Cannot log in", "My password reset and 2FA are not working")
    assert c.category == Category.account_access


def test_billing_category():
    c = classify_text("Refund request", "I need a refund for a duplicate invoice charge")
    assert c.category == Category.billing_question


def test_bug_report_category():
    c = classify_text("Bug found", "There is a defect, here are the steps to reproduce")
    assert c.category == Category.bug_report


def test_feature_request_category():
    c = classify_text("Suggestion", "Please add a dark mode, it would be nice enhancement")
    assert c.category == Category.feature_request


def test_other_category_when_no_keywords():
    c = classify_text("Hello", "Just saying hi to the wonderful team today")
    assert c.category == Category.other
    assert c.confidence <= 0.3


def test_urgent_priority():
    c = classify_text("Production down", "This is critical, a security incident right now")
    assert c.priority == Priority.urgent


def test_high_priority():
    c = classify_text("Important request", "This is blocking my team, please handle asap")
    assert c.priority == Priority.high


def test_low_priority():
    c = classify_text("Minor issue", "Just a cosmetic suggestion, very low importance")
    assert c.priority == Priority.low


def test_default_medium_priority():
    c = classify_text("Question", "I have a general question about using the reporting page")
    assert c.priority == Priority.medium


def test_result_includes_reasoning_and_keywords():
    c = classify_text("Cannot access billing", "critical payment invoice issue with refund")
    assert c.reasoning
    assert c.keywords_found
    assert 0.0 <= c.confidence <= 1.0


def test_endpoint_applies_and_returns_classification(client, valid_ticket_payload):
    created = client.post("/tickets", json=valid_ticket_payload).json()
    resp = client.post(f"/tickets/{created['id']}/auto-classify")
    assert resp.status_code == 200
    body = resp.json()
    assert body["classification"]["category"] == body["category"]
    assert body["classification"]["keywords_found"]
