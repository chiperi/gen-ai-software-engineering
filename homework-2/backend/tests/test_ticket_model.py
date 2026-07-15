"""Data-model validation tests (Task 3 — 9 tests)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.models import (
    Category,
    Priority,
    Source,
    Status,
    Ticket,
    TicketCreate,
    TicketMetadata,
)

BASE = {
    "customer_id": "CUST-1",
    "customer_email": "a@b.com",
    "customer_name": "A B",
    "subject": "A valid subject",
    "description": "A valid description that is definitely long enough.",
}


def test_valid_create_payload():
    t = TicketCreate(**BASE)
    assert t.category == Category.other
    assert t.priority == Priority.medium
    assert t.status == Status.new


def test_invalid_email_rejected():
    with pytest.raises(ValidationError):
        TicketCreate(**{**BASE, "customer_email": "not-email"})


def test_subject_too_long_rejected():
    with pytest.raises(ValidationError):
        TicketCreate(**{**BASE, "subject": "x" * 201})


def test_subject_empty_rejected():
    with pytest.raises(ValidationError):
        TicketCreate(**{**BASE, "subject": ""})


def test_description_too_short_rejected():
    with pytest.raises(ValidationError):
        TicketCreate(**{**BASE, "description": "short"})


def test_description_too_long_rejected():
    with pytest.raises(ValidationError):
        TicketCreate(**{**BASE, "description": "x" * 2001})


def test_invalid_enum_rejected():
    with pytest.raises(ValidationError):
        TicketCreate(**{**BASE, "category": "not_a_category"})


def test_metadata_defaults_to_web_form():
    meta = TicketMetadata()
    assert meta.source == Source.web_form
    assert meta.browser is None
    assert meta.device_type is None


def test_ticket_from_create_sets_server_fields():
    ticket = Ticket.from_create(TicketCreate(**BASE))
    assert ticket.id
    assert ticket.created_at == ticket.updated_at
    assert ticket.resolved_at is None
