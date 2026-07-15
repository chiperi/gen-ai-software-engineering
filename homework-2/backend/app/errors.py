"""Unified error shape and exception handlers.

All error responses use ``{"error": "...", "details": [{"field","message"}]}``
so both API consumers and the frontend can parse failures uniformly.
"""

from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class TicketNotFoundError(Exception):
    def __init__(self, ticket_id: str) -> None:
        self.ticket_id = ticket_id
        super().__init__(f"Ticket '{ticket_id}' not found")


class ImportError_(Exception):
    """Raised when a whole import file is malformed / unparseable."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


def error_body(message: str, details: list[dict] | None = None) -> dict:
    return {"error": message, "details": details or []}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(TicketNotFoundError)
    async def _not_found(_: Request, exc: TicketNotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=error_body(str(exc)),
        )

    @app.exception_handler(ImportError_)
    async def _import_error(_: Request, exc: ImportError_) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=error_body(exc.message),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        details = [
            {
                "field": ".".join(str(p) for p in err["loc"] if p != "body"),
                "message": err["msg"],
            }
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=error_body("Validation failed", details),
        )
