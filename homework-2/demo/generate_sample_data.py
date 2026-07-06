#!/usr/bin/env python3
"""Generate the deliverable sample data files.

Writes, at the homework-2 root:
  sample_tickets.csv   (50 tickets)
  sample_tickets.json  (20 tickets)
  sample_tickets.xml   (30 tickets)
  invalid_tickets.csv / .json / .xml   (files with bad rows for negative tests)

Deterministic (no randomness) so re-running produces identical files.
"""

from __future__ import annotations

import csv
import io
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from xml.dom import minidom

ROOT = Path(__file__).resolve().parent.parent

# Realistic templates spanning every category + priority signal.
TEMPLATES = [
    ("Cannot log in to my account", "I can't access my account, my password reset link is broken. This is critical.", "account_access", ["login", "password"], "web_form", "desktop"),
    ("2FA codes not arriving", "My two-factor authentication codes never arrive, this is a security problem.", "account_access", ["2fa", "security"], "email", "mobile"),
    ("Locked out after password change", "I changed my password and now I am locked out and cannot sign in.", "account_access", ["password", "login"], "chat", "desktop"),
    ("App crashes on report export", "The application crashes with an exception every time I export a report.", "technical_issue", ["crash", "error"], "api", "desktop"),
    ("500 error on dashboard", "The dashboard shows a 500 server error and the whole page is down.", "technical_issue", ["error", "down"], "web_form", "tablet"),
    ("Sync fails intermittently", "Data sync fails with a timeout, this is blocking my team from working.", "technical_issue", ["timeout", "blocking"], "email", "desktop"),
    ("Refund for double charge", "I was charged twice for my subscription invoice, please issue a refund asap.", "billing_question", ["refund", "invoice", "asap"], "email", "mobile"),
    ("Invoice missing line items", "My latest invoice is missing several line items and the payment total is wrong.", "billing_question", ["invoice", "payment"], "web_form", "desktop"),
    ("Update credit card on file", "I need to update the credit card used for my subscription billing.", "billing_question", ["credit card", "billing"], "phone", "desktop"),
    ("Please add dark mode", "It would be nice to please add a dark mode theme, a great enhancement suggestion.", "feature_request", ["feature", "suggestion"], "chat", "desktop"),
    ("Bulk export feature", "Feature request: please add a bulk export option, it would improve my workflow.", "feature_request", ["feature request", "improve"], "web_form", "tablet"),
    ("Keyboard shortcuts wish", "I wish there were keyboard shortcuts, this enhancement would be nice to have.", "feature_request", ["enhancement", "wish"], "api", "desktop"),
    ("Bug: totals miscalculated", "There is a bug, the totals are miscalculated. Steps to reproduce are attached.", "bug_report", ["bug", "steps to reproduce"], "web_form", "desktop"),
    ("Regression after update", "A regression appeared after the last update, this defect blocks checkout.", "bug_report", ["regression", "defect", "blocking"], "email", "mobile"),
    ("Glitch in date picker", "Minor glitch in the date picker, a cosmetic bug of low importance.", "bug_report", ["glitch", "bug", "cosmetic"], "chat", "tablet"),
    ("General question about limits", "I have a general question about the usage limits on my current plan.", "other", [], "web_form", "desktop"),
    ("How do I invite teammates", "Can you explain how I invite teammates to my workspace? Thanks in advance.", "other", [], "email", "mobile"),
    ("Feedback on onboarding", "Just sharing some general feedback about the onboarding experience overall.", "other", [], "chat", "desktop"),
    ("Production is down now", "Production is down and this is a critical outage affecting all our users.", "technical_issue", ["production down", "critical"], "phone", "desktop"),
    ("Important billing discrepancy", "Important: there is a billing discrepancy on my invoice that is blocking payroll.", "billing_question", ["important", "invoice", "blocking"], "email", "desktop"),
]

NAMES = [
    "Alice Doe", "Bob Smith", "Carol Jones", "Dave Lee", "Eve Adams",
    "Frank Moore", "Grace Kim", "Heidi North", "Ivan Petrov", "Judy Blume",
]


def build_records(count: int) -> list[dict]:
    records = []
    for i in range(count):
        subj, desc, cat, tags, source, device = TEMPLATES[i % len(TEMPLATES)]
        name = NAMES[i % len(NAMES)]
        records.append({
            "customer_id": f"CUST-{1000 + i}",
            "customer_email": f"user{i}@example.com",
            "customer_name": name,
            "subject": subj,
            "description": desc,
            "category": cat,
            "tags": tags,
            "source": source,
            "device_type": device,
        })
    return records


def write_csv(records: list[dict], path: Path) -> None:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "customer_id", "customer_email", "customer_name", "subject",
        "description", "tags", "source", "device_type",
    ])
    for r in records:
        writer.writerow([
            r["customer_id"], r["customer_email"], r["customer_name"], r["subject"],
            r["description"], ",".join(r["tags"]), r["source"], r["device_type"],
        ])
    path.write_text(buf.getvalue(), encoding="utf-8")


def write_json(records: list[dict], path: Path) -> None:
    out = [{
        "customer_id": r["customer_id"],
        "customer_email": r["customer_email"],
        "customer_name": r["customer_name"],
        "subject": r["subject"],
        "description": r["description"],
        "tags": r["tags"],
        "metadata": {"source": r["source"], "device_type": r["device_type"]},
    } for r in records]
    path.write_text(json.dumps(out, indent=2), encoding="utf-8")


def write_xml(records: list[dict], path: Path) -> None:
    root = ET.Element("tickets")
    for r in records:
        t = ET.SubElement(root, "ticket")
        for key in ("customer_id", "customer_email", "customer_name", "subject", "description"):
            ET.SubElement(t, key).text = r[key]
        tags = ET.SubElement(t, "tags")
        for tag in r["tags"]:
            ET.SubElement(tags, "tag").text = tag
        meta = ET.SubElement(t, "metadata")
        ET.SubElement(meta, "source").text = r["source"]
        ET.SubElement(meta, "device_type").text = r["device_type"]
    xml = minidom.parseString(ET.tostring(root)).toprettyxml(indent="  ")
    path.write_text(xml, encoding="utf-8")


def write_invalid_files() -> None:
    # CSV: bad email, empty subject, then one valid row.
    (ROOT / "invalid_tickets.csv").write_text(
        "customer_id,customer_email,customer_name,subject,description,tags,source,device_type\n"
        "CUST-9000,not-an-email,Bad Email,Broken row,This description is long enough to be valid.,bug,web_form,desktop\n"
        "CUST-9001,ok@example.com,No Subject,,This row has an empty subject which is invalid here.,bug,email,mobile\n"
        "CUST-9002,good@example.com,Good Row,Totally valid subject,This last row is completely valid and imports fine.,ok,web_form,desktop\n",
        encoding="utf-8",
    )
    # JSON: one bad (short description), one valid.
    (ROOT / "invalid_tickets.json").write_text(json.dumps([
        {"customer_id": "CUST-9100", "customer_email": "bad@example.com",
         "customer_name": "Short Desc", "subject": "Bad row", "description": "short"},
        {"customer_id": "CUST-9101", "customer_email": "fine@example.com",
         "customer_name": "Fine Row", "subject": "Valid row",
         "description": "This row is valid and should import without any issue whatsoever."},
    ], indent=2), encoding="utf-8")
    # XML: one bad (bad email), one valid.
    (ROOT / "invalid_tickets.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<tickets>\n'
        '  <ticket>\n    <customer_id>CUST-9200</customer_id>\n'
        '    <customer_email>bad-email</customer_email>\n    <customer_name>Bad</customer_name>\n'
        '    <subject>Bad email row</subject>\n'
        '    <description>This row has an invalid email and should fail validation cleanly.</description>\n  </ticket>\n'
        '  <ticket>\n    <customer_id>CUST-9201</customer_id>\n'
        '    <customer_email>ok@example.com</customer_email>\n    <customer_name>Good</customer_name>\n'
        '    <subject>Valid xml row</subject>\n'
        '    <description>This XML row is valid and should be imported successfully as expected.</description>\n  </ticket>\n'
        '</tickets>\n',
        encoding="utf-8",
    )


def main() -> None:
    write_csv(build_records(50), ROOT / "sample_tickets.csv")
    write_json(build_records(20), ROOT / "sample_tickets.json")
    write_xml(build_records(30), ROOT / "sample_tickets.xml")
    write_invalid_files()
    print("Wrote sample_tickets.{csv,json,xml} and invalid_tickets.{csv,json,xml}")


if __name__ == "__main__":
    main()
