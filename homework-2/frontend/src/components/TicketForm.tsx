import { useState } from "react";
import {
  CATEGORIES,
  DEVICE_TYPES,
  PRIORITIES,
  SOURCES,
  STATUSES,
  type Ticket,
  type TicketInput,
} from "../types";

interface Props {
  initial?: Ticket | null;
  onSubmit: (input: TicketInput) => Promise<void>;
  onClose: () => void;
}

function emptyInput(): TicketInput {
  return {
    customer_id: "",
    customer_email: "",
    customer_name: "",
    subject: "",
    description: "",
    category: "other",
    priority: "medium",
    status: "new",
    assigned_to: "",
    tags: [],
    metadata: { source: "web_form", browser: "", device_type: "desktop" },
  };
}

function fromTicket(t: Ticket): TicketInput {
  return {
    customer_id: t.customer_id,
    customer_email: t.customer_email,
    customer_name: t.customer_name,
    subject: t.subject,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    assigned_to: t.assigned_to ?? "",
    tags: t.tags,
    metadata: { ...t.metadata },
  };
}

// Client-side validation mirroring the backend constraints.
function validate(input: TicketInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.customer_id.trim()) errors.customer_id = "Required";
  if (!input.customer_name.trim()) errors.customer_name = "Required";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.customer_email))
    errors.customer_email = "Enter a valid email";
  if (input.subject.trim().length < 1 || input.subject.length > 200)
    errors.subject = "1–200 characters";
  if (input.description.trim().length < 10 || input.description.length > 2000)
    errors.description = "10–2000 characters";
  return errors;
}

export function TicketForm({ initial, onSubmit, onClose }: Props) {
  const [input, setInput] = useState<TicketInput>(initial ? fromTicket(initial) : emptyInput());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof TicketInput>(key: K, value: TicketInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(input);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    try {
      await onSubmit(input);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial ? "Edit ticket" : "New ticket"}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid-2">
            <label>
              Customer ID
              <input value={input.customer_id} onChange={(e) => set("customer_id", e.target.value)} />
              {errors.customer_id && <span className="field-error">{errors.customer_id}</span>}
            </label>
            <label>
              Customer name
              <input value={input.customer_name} onChange={(e) => set("customer_name", e.target.value)} />
              {errors.customer_name && <span className="field-error">{errors.customer_name}</span>}
            </label>
          </div>
          <label>
            Customer email
            <input value={input.customer_email} onChange={(e) => set("customer_email", e.target.value)} />
            {errors.customer_email && <span className="field-error">{errors.customer_email}</span>}
          </label>
          <label>
            Subject
            <input value={input.subject} onChange={(e) => set("subject", e.target.value)} maxLength={200} />
            {errors.subject && <span className="field-error">{errors.subject}</span>}
          </label>
          <label>
            Description
            <textarea rows={4} value={input.description} onChange={(e) => set("description", e.target.value)} />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </label>
          <div className="grid-3">
            <label>
              Category
              <select value={input.category} onChange={(e) => set("category", e.target.value as TicketInput["category"])}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </label>
            <label>
              Priority
              <select value={input.priority} onChange={(e) => set("priority", e.target.value as TicketInput["priority"])}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label>
              Status
              <select value={input.status} onChange={(e) => set("status", e.target.value as TicketInput["status"])}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </label>
          </div>
          <div className="grid-3">
            <label>
              Source
              <select
                value={input.metadata.source}
                onChange={(e) => set("metadata", { ...input.metadata, source: e.target.value as TicketInput["metadata"]["source"] })}
              >
                {SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </label>
            <label>
              Device
              <select
                value={input.metadata.device_type ?? "desktop"}
                onChange={(e) => set("metadata", { ...input.metadata, device_type: e.target.value as TicketInput["metadata"]["device_type"] })}
              >
                {DEVICE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label>
              Assigned to
              <input value={input.assigned_to ?? ""} onChange={(e) => set("assigned_to", e.target.value)} />
            </label>
          </div>
          <label>
            Tags (comma-separated)
            <input
              value={input.tags.join(", ")}
              onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : initial ? "Save changes" : "Create ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
