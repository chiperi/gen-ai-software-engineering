"""Deterministic keyword-based auto-classifier.

Categorisation counts keyword hits per category over ``subject + description``
and picks the winner (``other`` when nothing matches). Priority follows the
explicit rules from ``TASKS.md``. A confidence score and human-readable
reasoning accompany every decision, and each decision is logged.
"""

from __future__ import annotations

import logging
import re

from .models import Category, Classification, Priority, Ticket

logger = logging.getLogger("classifier")

# Keyword tables --------------------------------------------------------------
CATEGORY_KEYWORDS: dict[Category, list[str]] = {
    Category.account_access: [
        "login", "log in", "password", "2fa", "two-factor", "sign in",
        "can't access", "cannot access", "locked out", "reset", "authentication",
        "account access",
    ],
    Category.technical_issue: [
        "error", "crash", "crashed", "exception", "not working", "broken",
        "fails", "failure", "timeout", "500", "server", "down",
    ],
    Category.billing_question: [
        "billing", "payment", "invoice", "refund", "charge", "charged",
        "subscription", "credit card", "pricing", "overcharged",
    ],
    Category.feature_request: [
        "feature request", "feature", "suggestion", "enhancement", "would be nice",
        "please add", "request to add", "improve", "wish",
    ],
    Category.bug_report: [
        "bug", "defect", "reproduce", "reproduction", "steps to reproduce",
        "unexpected behavior", "glitch", "regression",
    ],
}

# Priority rules (ordered urgent -> high -> low; default medium) ---------------
PRIORITY_KEYWORDS: dict[Priority, list[str]] = {
    Priority.urgent: ["can't access", "cannot access", "critical", "production down", "security"],
    Priority.high: ["important", "blocking", "asap"],
    Priority.low: ["minor", "cosmetic", "suggestion"],
}


def _find(text: str, keywords: list[str]) -> list[str]:
    """Return keywords present in ``text`` as whole words / phrases."""
    hits: list[str] = []
    for kw in keywords:
        pattern = r"\b" + re.escape(kw) + r"\b"
        if re.search(pattern, text):
            hits.append(kw)
    return hits


def classify_text(subject: str, description: str) -> Classification:
    text = f"{subject} {description}".lower()

    # --- category ---
    category_hits: dict[Category, list[str]] = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        found = _find(text, keywords)
        if found:
            category_hits[category] = found

    if category_hits:
        best_category = max(category_hits, key=lambda c: len(category_hits[c]))
        category_keywords = category_hits[best_category]
    else:
        best_category = Category.other
        category_keywords = []

    # --- priority (first matching tier wins) ---
    priority = Priority.medium
    priority_keywords: list[str] = []
    for tier in (Priority.urgent, Priority.high, Priority.low):
        found = _find(text, PRIORITY_KEYWORDS[tier])
        if found:
            priority = tier
            priority_keywords = found
            break

    keywords_found = category_keywords + priority_keywords

    # --- confidence: scales with how many signals we matched (capped) ---
    total_hits = len(keywords_found)
    if best_category == Category.other and not priority_keywords:
        confidence = 0.2
    else:
        confidence = round(min(0.5 + 0.15 * total_hits, 0.99), 2)

    reasoning = (
        f"Matched category '{best_category.value}' via "
        f"{category_keywords or 'no category keywords'}; "
        f"priority '{priority.value}' via "
        f"{priority_keywords or 'default (no priority keywords)'}."
    )

    result = Classification(
        category=best_category,
        priority=priority,
        confidence=confidence,
        reasoning=reasoning,
        keywords_found=keywords_found,
    )
    logger.info(
        "classified category=%s priority=%s confidence=%.2f keywords=%s",
        result.category.value, result.priority.value, result.confidence,
        result.keywords_found,
    )
    return result


def classify_ticket(ticket: Ticket) -> Classification:
    return classify_text(ticket.subject, ticket.description)
