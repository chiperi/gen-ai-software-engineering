# API Reference

> Base URL: `http://localhost:3000` · Content type: `application/json`
> Interactive docs (Swagger UI): `http://localhost:3000/docs`

_Generated with the assistance of Claude Sonnet 5._

## Data model

### Ticket

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | server-generated |
| `customer_id` | string | required, non-empty |
| `customer_email` | string (email) | required, valid email |
| `customer_name` | string | required, non-empty |
| `subject` | string | required, 1–200 chars |
| `description` | string | required, 10–2000 chars |
| `category` | enum | `account_access` · `technical_issue` · `billing_question` · `feature_request` · `bug_report` · `other` |
| `priority` | enum | `urgent` · `high` · `medium` · `low` |
| `status` | enum | `new` · `in_progress` · `waiting_customer` · `resolved` · `closed` |
| `created_at` | datetime | server-set |
| `updated_at` | datetime | server-set |
| `resolved_at` | datetime \| null | set when status → `resolved` |
| `assigned_to` | string \| null | |
| `tags` | string[] | |
| `metadata` | object | `{ source, browser?, device_type? }` |
| `classification` | object \| null | populated after auto-classify |

`metadata.source` ∈ `web_form · email · api · chat · phone`;
`metadata.device_type` ∈ `desktop · mobile · tablet`.

### Classification

```json
{
  "category": "account_access",
  "priority": "urgent",
  "confidence": 0.8,
  "reasoning": "Matched category 'account_access' via [...]; priority 'urgent' via [...].",
  "keywords_found": ["password", "can't access", "security"]
}
```

### Error format

All errors share one shape:

```json
{ "error": "Validation failed", "details": [{ "field": "customer_email", "message": "value is not a valid email address" }] }
```

---

## Endpoints

### `POST /tickets` — create a ticket

Query: `auto_classify=true` (optional) runs classification on create.
Returns **201** with the created ticket, or **400** on validation errors.

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST-001",
    "customer_email": "alice@example.com",
    "customer_name": "Alice Doe",
    "subject": "Cannot log in",
    "description": "My password reset link is broken and I cannot access my account.",
    "metadata": { "source": "web_form", "device_type": "desktop" },
    "tags": ["login"]
  }'
```

### `POST /tickets/import` — bulk import

Multipart upload of a `.csv`, `.json`, or `.xml` file. Format is inferred from
the filename or overridden with `?format=csv|json|xml`. Optional
`?auto_classify=true`. Returns **200** with a summary; a wholly malformed file
returns **400**.

```bash
curl -X POST "http://localhost:3000/tickets/import?auto_classify=true" \
  -F "file=@sample_tickets.csv"
```

Response:

```json
{
  "total": 50,
  "successful": 50,
  "failed": 0,
  "errors": [],
  "created_ids": ["…"]
}
```

### `GET /tickets` — list (with filters)

Optional query params `category`, `priority`, `status` (combined with AND).

```bash
curl "http://localhost:3000/tickets?category=billing_question&priority=high"
```

### `GET /tickets/{id}` — get one

Returns **200** with the ticket or **404** if not found.

```bash
curl http://localhost:3000/tickets/<id>
```

### `PUT /tickets/{id}` — update

Partial update — send only the fields to change. Moving `status` to `resolved`
sets `resolved_at`. Returns **200** or **404**.

```bash
curl -X PUT http://localhost:3000/tickets/<id> \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved", "assigned_to": "agent-7"}'
```

### `DELETE /tickets/{id}` — delete

Returns **204** (no body) or **404**.

```bash
curl -X DELETE http://localhost:3000/tickets/<id>
```

### `POST /tickets/{id}/auto-classify` — classify

Runs the keyword classifier, applies category + priority to the ticket, stores
and returns it with the `classification` object. Returns **404** if not found.

```bash
curl -X POST http://localhost:3000/tickets/<id>/auto-classify
```

### `GET /health` — liveness

```bash
curl http://localhost:3000/health   # {"status":"ok"}
```

---

## Status codes

| Code | Meaning |
|------|---------|
| 201 | Ticket created |
| 200 | Success (get / list / update / import / classify) |
| 204 | Deleted (no content) |
| 400 | Validation error or malformed import file |
| 404 | Ticket not found |
