"""In-memory, thread-safe ticket store.

A plain ``dict`` guarded by a ``threading.Lock`` — enough for the assignment and
correct under the concurrent-request integration test (20+ simultaneous writes).
"""

from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Optional

from .errors import TicketNotFoundError
from .models import Category, Priority, Status, Ticket, TicketUpdate


class TicketRepository:
    def __init__(self) -> None:
        self._tickets: dict[str, Ticket] = {}
        self._lock = threading.Lock()

    def clear(self) -> None:
        with self._lock:
            self._tickets.clear()

    def add(self, ticket: Ticket) -> Ticket:
        with self._lock:
            self._tickets[ticket.id] = ticket
        return ticket

    def get(self, ticket_id: str) -> Ticket:
        with self._lock:
            ticket = self._tickets.get(ticket_id)
        if ticket is None:
            raise TicketNotFoundError(ticket_id)
        return ticket

    def list(
        self,
        *,
        category: Optional[Category] = None,
        priority: Optional[Priority] = None,
        status: Optional[Status] = None,
    ) -> list[Ticket]:
        with self._lock:
            items = list(self._tickets.values())
        if category is not None:
            items = [t for t in items if t.category == category]
        if priority is not None:
            items = [t for t in items if t.priority == priority]
        if status is not None:
            items = [t for t in items if t.status == status]
        return sorted(items, key=lambda t: t.created_at)

    def update(self, ticket_id: str, changes: TicketUpdate) -> Ticket:
        with self._lock:
            ticket = self._tickets.get(ticket_id)
            if ticket is None:
                raise TicketNotFoundError(ticket_id)
            data = changes.model_dump(exclude_unset=True)
            updated = ticket.model_copy(update=data)
            updated.updated_at = datetime.now(timezone.utc)
            # Set resolved_at when moving into a resolved state (and only then).
            if (
                updated.status == Status.resolved
                and ticket.status != Status.resolved
                and updated.resolved_at is None
            ):
                updated.resolved_at = updated.updated_at
            self._tickets[ticket_id] = updated
        return updated

    def delete(self, ticket_id: str) -> None:
        with self._lock:
            if ticket_id not in self._tickets:
                raise TicketNotFoundError(ticket_id)
            del self._tickets[ticket_id]

    def count(self) -> int:
        with self._lock:
            return len(self._tickets)


# Module-level singleton used by the app.
repository = TicketRepository()
