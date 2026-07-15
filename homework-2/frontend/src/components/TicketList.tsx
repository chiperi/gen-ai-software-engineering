import type { Ticket } from "../types";
import { Badge } from "./Badge";

interface Props {
  tickets: Ticket[];
  loading: boolean;
  onSelect: (t: Ticket) => void;
  onEdit: (t: Ticket) => void;
  onClassify: (t: Ticket) => void;
  onDelete: (t: Ticket) => void;
}

export function TicketList({ tickets, loading, onSelect, onEdit, onClassify, onDelete }: Props) {
  if (loading) return <p className="muted">Loading tickets…</p>;
  if (tickets.length === 0) return <p className="muted">No tickets match the current filters.</p>;

  return (
    <div className="table-wrap">
      <table className="ticket-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Customer</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th aria-label="actions"></th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t, i) => (
            <tr key={t.id} style={{ animationDelay: `${Math.min(i, 15) * 28}ms` }}>
              <td>
                <button className="link" onClick={() => onSelect(t)}>{t.subject}</button>
                {t.classification && (
                  <span className="confidence" title="classification confidence">
                    {Math.round(t.classification.confidence * 100)}%
                  </span>
                )}
              </td>
              <td>{t.customer_name}</td>
              <td><Badge kind="category" value={t.category} /></td>
              <td><Badge kind="priority" value={t.priority} /></td>
              <td><Badge kind="status" value={t.status} /></td>
              <td className="row-actions">
                <button className="btn-ghost" onClick={() => onClassify(t)}>Classify</button>
                <button className="btn-ghost" onClick={() => onEdit(t)}>Edit</button>
                <button className="btn-danger" onClick={() => onDelete(t)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
