"""Pydantic models and enums for the support-ticket domain.

The models mirror the ticket schema from ``TASKS.md``. ``TicketCreate`` is the
inbound payload (client-supplied fields, fully validated); ``Ticket`` is the
stored/returned entity (adds server-managed id and timestamps); ``TicketUpdate``
is the partial-update payload used by ``PUT /tickets/{id}``.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, model_validator


# --------------------------------------------------------------------------- #
# Enums                                                                        #
# --------------------------------------------------------------------------- #
class Category(str, Enum):
    account_access = "account_access"
    technical_issue = "technical_issue"
    billing_question = "billing_question"
    feature_request = "feature_request"
    bug_report = "bug_report"
    other = "other"


class Priority(str, Enum):
    urgent = "urgent"
    high = "high"
    medium = "medium"
    low = "low"


class Status(str, Enum):
    new = "new"
    in_progress = "in_progress"
    waiting_customer = "waiting_customer"
    resolved = "resolved"
    closed = "closed"


class Source(str, Enum):
    web_form = "web_form"
    email = "email"
    api = "api"
    chat = "chat"
    phone = "phone"


class DeviceType(str, Enum):
    desktop = "desktop"
    mobile = "mobile"
    tablet = "tablet"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------- #
# Nested models                                                                #
# --------------------------------------------------------------------------- #
class TicketMetadata(BaseModel):
    source: Source = Source.web_form
    browser: Optional[str] = None
    device_type: Optional[DeviceType] = None


# --------------------------------------------------------------------------- #
# Request / entity models                                                      #
# --------------------------------------------------------------------------- #
class TicketCreate(BaseModel):
    """Inbound payload for creating a ticket (and for each imported row)."""

    customer_id: str = Field(..., min_length=1)
    customer_email: EmailStr
    customer_name: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    category: Category = Category.other
    priority: Priority = Priority.medium
    status: Status = Status.new
    assigned_to: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    metadata: TicketMetadata = Field(default_factory=TicketMetadata)


class TicketUpdate(BaseModel):
    """Partial-update payload — every field optional."""

    customer_id: Optional[str] = Field(default=None, min_length=1)
    customer_email: Optional[EmailStr] = None
    customer_name: Optional[str] = Field(default=None, min_length=1)
    subject: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, min_length=10, max_length=2000)
    category: Optional[Category] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None
    assigned_to: Optional[str] = None
    tags: Optional[list[str]] = None
    metadata: Optional[TicketMetadata] = None


class Classification(BaseModel):
    """Result of the auto-classifier (stored on the ticket, and returned)."""

    category: Category
    priority: Priority
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str
    keywords_found: list[str] = Field(default_factory=list)


class Ticket(BaseModel):
    """Stored ticket entity with server-managed fields."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_email: EmailStr
    customer_name: str
    subject: str
    description: str
    category: Category = Category.other
    priority: Priority = Priority.medium
    status: Status = Status.new
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    metadata: TicketMetadata = Field(default_factory=TicketMetadata)
    classification: Optional[Classification] = None

    @model_validator(mode="after")
    def _default_updated_at(self) -> "Ticket":
        # A freshly created ticket has updated_at == created_at; updates set it
        # explicitly (see repository.update).
        if self.updated_at is None:
            self.updated_at = self.created_at
        return self

    @classmethod
    def from_create(cls, payload: TicketCreate) -> "Ticket":
        return cls(**payload.model_dump())
