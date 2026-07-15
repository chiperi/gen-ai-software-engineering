"""Parsers for bulk ticket import (CSV, JSON, XML).

Each parser turns raw bytes into a list of plain dicts. ``parse_and_validate``
then validates every row against ``TicketCreate``, collecting per-row errors
without aborting the whole import. A file that is itself unparseable raises
``ImportError_`` (HTTP 400).
"""

from __future__ import annotations

import csv
import io
import json
import xml.etree.ElementTree as ET
from typing import Any

from pydantic import ValidationError

from .errors import ImportError_
from .models import Ticket, TicketCreate

# Columns that should be split from a delimited string into a list.
_LIST_FIELDS = {"tags"}
_METADATA_FIELDS = {"source", "browser", "device_type"}


def _normalise_row(row: dict[str, Any]) -> dict[str, Any]:
    """Normalise a flat row into the nested TicketCreate shape.

    Accepts flat CSV/XML columns like ``metadata.source`` or ``source`` and a
    delimited ``tags`` string, and folds them into nested structures.
    """
    out: dict[str, Any] = {}
    metadata: dict[str, Any] = {}
    for key, value in row.items():
        if key is None:
            continue
        key = key.strip()
        if isinstance(value, str):
            value = value.strip()
        if value in ("", None):
            # Skip empty cells so model defaults apply.
            if key in _LIST_FIELDS:
                out[key] = []
            continue
        if key in _LIST_FIELDS:
            out[key] = [t.strip() for t in str(value).split(",") if t.strip()]
        elif key.startswith("metadata."):
            metadata[key.split(".", 1)[1]] = value
        elif key in _METADATA_FIELDS:
            metadata[key] = value
        else:
            out[key] = value
    if metadata:
        out["metadata"] = {**out.get("metadata", {}), **metadata}
    return out


def parse_csv(data: bytes) -> list[dict[str, Any]]:
    try:
        text = data.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        if reader.fieldnames is None:
            raise ImportError_("CSV file is empty or has no header row")
        return [_normalise_row(row) for row in reader]
    except ImportError_:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        raise ImportError_(f"Malformed CSV file: {exc}") from exc


def parse_json(data: bytes) -> list[dict[str, Any]]:
    try:
        parsed = json.loads(data.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ImportError_(f"Malformed JSON file: {exc}") from exc
    if isinstance(parsed, dict):
        parsed = parsed.get("tickets", parsed)
    if not isinstance(parsed, list):
        raise ImportError_("JSON import must be an array of ticket objects")
    return [row if isinstance(row, dict) else {} for row in parsed]


def parse_xml(data: bytes) -> list[dict[str, Any]]:
    try:
        root = ET.fromstring(data.decode("utf-8"))
    except (ET.ParseError, UnicodeDecodeError) as exc:
        raise ImportError_(f"Malformed XML file: {exc}") from exc

    tickets = root.findall("ticket") or root.findall(".//ticket")
    rows: list[dict[str, Any]] = []
    for node in tickets:
        row: dict[str, Any] = {}
        metadata: dict[str, Any] = {}
        for child in node:
            tag = child.tag
            text = (child.text or "").strip()
            if tag == "metadata":
                for meta_child in child:
                    if (meta_child.text or "").strip():
                        metadata[meta_child.tag] = meta_child.text.strip()
            elif tag == "tags":
                items = [c.text.strip() for c in child if c.text and c.text.strip()]
                row["tags"] = items or [t.strip() for t in text.split(",") if t.strip()]
            elif text:
                row[tag] = text
        if metadata:
            row["metadata"] = metadata
        rows.append(row)
    return rows


_PARSERS = {"csv": parse_csv, "json": parse_json, "xml": parse_xml}


def detect_format(filename: str | None, explicit: str | None) -> str:
    if explicit:
        fmt = explicit.lower().lstrip(".")
    elif filename and "." in filename:
        fmt = filename.rsplit(".", 1)[1].lower()
    else:
        raise ImportError_("Could not determine file format (use ?format=csv|json|xml)")
    if fmt not in _PARSERS:
        raise ImportError_(f"Unsupported format '{fmt}' (expected csv, json or xml)")
    return fmt


def parse_and_validate(data: bytes, fmt: str) -> tuple[list[TicketCreate], list[dict]]:
    """Return ``(valid_payloads, errors)`` — one error entry per bad row."""
    rows = _PARSERS[fmt](data)
    valid: list[TicketCreate] = []
    errors: list[dict] = []
    for index, row in enumerate(rows):
        try:
            valid.append(TicketCreate(**row))
        except ValidationError as exc:
            messages = "; ".join(
                f"{'.'.join(str(p) for p in e['loc'])}: {e['msg']}" for e in exc.errors()
            )
            errors.append({"row": index, "message": messages})
        except TypeError as exc:
            errors.append({"row": index, "message": str(exc)})
    return valid, errors
