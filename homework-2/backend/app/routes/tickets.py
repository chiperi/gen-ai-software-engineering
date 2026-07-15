"""Ticket REST endpoints (Task 1) and the auto-classify endpoint (Task 2)."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, File, Query, Response, UploadFile, status

from ..classifier import classify_ticket
from ..importers import detect_format, parse_and_validate
from ..models import (
    Category,
    Priority,
    Status,
    Ticket,
    TicketCreate,
    TicketUpdate,
)
from ..repository import repository

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _classify_and_store(ticket: Ticket) -> Ticket:
    """Classify a stored ticket, persist category/priority + result, return it."""
    result = classify_ticket(ticket)
    repository.update(
        ticket.id, TicketUpdate(category=result.category, priority=result.priority)
    )
    stored = repository.get(ticket.id)
    stored.classification = result
    return repository.add(stored)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate,
    auto_classify: bool = Query(False, description="Run auto-classification on create"),
) -> Ticket:
    ticket = repository.add(Ticket.from_create(payload))
    if auto_classify:
        ticket = _classify_and_store(ticket)
    return ticket


@router.post("/import")
def import_tickets(
    file: UploadFile = File(...),
    format: Optional[str] = Query(None, description="Override format: csv|json|xml"),
    auto_classify: bool = Query(False, description="Auto-classify each imported ticket"),
) -> dict:
    raw = file.file.read()
    fmt = detect_format(file.filename, format)
    valid, errors = parse_and_validate(raw, fmt)

    created_ids: list[str] = []
    for payload in valid:
        ticket = repository.add(Ticket.from_create(payload))
        if auto_classify:
            _classify_and_store(ticket)
        created_ids.append(ticket.id)

    return {
        "total": len(valid) + len(errors),
        "successful": len(created_ids),
        "failed": len(errors),
        "errors": errors,
        "created_ids": created_ids,
    }


@router.get("")
def list_tickets(
    category: Optional[Category] = None,
    priority: Optional[Priority] = None,
    status: Optional[Status] = None,
) -> list[Ticket]:
    return repository.list(category=category, priority=priority, status=status)


@router.get("/{ticket_id}")
def get_ticket(ticket_id: str) -> Ticket:
    return repository.get(ticket_id)


@router.put("/{ticket_id}")
def update_ticket(ticket_id: str, changes: TicketUpdate) -> Ticket:
    return repository.update(ticket_id, changes)


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: str) -> Response:
    repository.delete(ticket_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{ticket_id}/auto-classify")
def auto_classify_ticket(ticket_id: str) -> Ticket:
    ticket = repository.get(ticket_id)
    return _classify_and_store(ticket)
