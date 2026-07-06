import type { Ticket } from "../types";
import { Badge } from "./Badge";

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onClassify: (t: Ticket) => void;
}

function fmt(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "—";
}

export function TicketDetail({ ticket, onClose, onClassify }: Props) {
  const c = ticket.classification;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{ticket.subject}</h2>
        <div className="badges">
          <Badge kind="category" value={ticket.category} />
          <Badge kind="priority" value={ticket.priority} />
          <Badge kind="status" value={ticket.status} />
        </div>
        <p className="description">{ticket.description}</p>

        <dl className="detail-grid">
          <dt>Customer</dt><dd>{ticket.customer_name} ({ticket.customer_email})</dd>
          <dt>Customer ID</dt><dd>{ticket.customer_id}</dd>
          <dt>Assigned to</dt><dd>{ticket.assigned_to ?? "—"}</dd>
          <dt>Tags</dt><dd>{ticket.tags.length ? ticket.tags.join(", ") : "—"}</dd>
          <dt>Source</dt><dd>{ticket.metadata.source}</dd>
          <dt>Device</dt><dd>{ticket.metadata.device_type ?? "—"}</dd>
          <dt>Browser</dt><dd>{ticket.metadata.browser ?? "—"}</dd>
          <dt>Created</dt><dd>{fmt(ticket.created_at)}</dd>
          <dt>Updated</dt><dd>{fmt(ticket.updated_at)}</dd>
          <dt>Resolved</dt><dd>{fmt(ticket.resolved_at)}</dd>
        </dl>

        <div className="classification-box">
          <div className="classification-head">
            <h3>Classification</h3>
            <button className="btn-ghost" onClick={() => onClassify(ticket)}>Re-run</button>
          </div>
          {c ? (
            <>
              <p>
                <Badge kind="category" value={c.category} />{" "}
                <Badge kind="priority" value={c.priority} />{" "}
                <strong>{Math.round(c.confidence * 100)}%</strong> confidence
              </p>
              <p className="muted">{c.reasoning}</p>
              {c.keywords_found.length > 0 && (
                <p className="keywords">
                  {c.keywords_found.map((k) => <span key={k} className="keyword">{k}</span>)}
                </p>
              )}
            </>
          ) : (
            <p className="muted">Not classified yet — click “Re-run” to auto-classify.</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
