"""Shared pytest fixtures."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repository import repository

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture(autouse=True)
def _clean_repository():
    """Every test starts with an empty in-memory store."""
    repository.clear()
    yield
    repository.clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def valid_ticket_payload() -> dict:
    return {
        "customer_id": "CUST-001",
        "customer_email": "alice@example.com",
        "customer_name": "Alice Doe",
        "subject": "Cannot log in to my account",
        "description": "I forgot my password and the reset link is not working at all.",
        "metadata": {"source": "web_form", "device_type": "desktop"},
        "tags": ["login"],
    }


def fixture_bytes(name: str) -> bytes:
    return (FIXTURES / name).read_bytes()
