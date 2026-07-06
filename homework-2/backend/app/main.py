"""FastAPI application entry point.

Serves the ticket API on port 3000 (matching the course's house style), with
CORS open for the Vite dev server, a ``/health`` probe, and auto-generated
OpenAPI docs at ``/docs``.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .errors import register_error_handlers
from .routes.tickets import router as tickets_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Intelligent Customer Support System",
    description="Support-ticket management: multi-format import + auto-classification.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)
app.include_router(tickets_router)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
