import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { api, ApiError } from "./api/client";
import { FilterBar } from "./components/Filters";
import { ImportPanel } from "./components/ImportPanel";
import { TicketDetail } from "./components/TicketDetail";
import { TicketForm } from "./components/TicketForm";
import { TicketList } from "./components/TicketList";
import { ToastProvider, useToast } from "./components/Toast";
import type { Filters, Ticket, TicketInput } from "./types";

function Dashboard() {
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [detail, setDetail] = useState<Ticket | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTickets(await api.list(filters));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const open = tickets.filter((t) =>
      ["new", "in_progress", "waiting_customer"].includes(t.status),
    ).length;
    return {
      total: tickets.length,
      urgent: tickets.filter((t) => t.priority === "urgent").length,
      open,
      resolved: tickets.filter((t) => ["resolved", "closed"].includes(t.status)).length,
    };
  }, [tickets]);

  const handleCreate = async (input: TicketInput) => {
    try {
      await api.create(input, true);
      toast.success("Ticket created");
      setFormOpen(false);
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Create failed");
    }
  };

  const handleUpdate = async (input: TicketInput) => {
    if (!editing) return;
    try {
      await api.update(editing.id, input);
      toast.success("Ticket updated");
      setEditing(null);
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  };

  const handleClassify = async (t: Ticket) => {
    try {
      const updated = await api.classify(t.id);
      toast.success(
        `Classified as ${updated.category} / ${updated.priority} ` +
          `(${Math.round((updated.classification?.confidence ?? 0) * 100)}%)`,
      );
      if (detail && detail.id === t.id) setDetail(updated);
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Classification failed");
    }
  };

  const handleDelete = async (t: Ticket) => {
    if (!window.confirm(`Delete ticket “${t.subject}”?`)) return;
    try {
      await api.remove(t.id);
      toast.success("Ticket deleted");
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>🎧 Support Tickets</h1>
          <p className="muted">Intelligent Customer Support System</p>
        </div>
        <button className="btn-primary" onClick={() => setFormOpen(true)}>+ New ticket</button>
      </header>

      <div className="stats">
        {[
          { label: "Total tickets", value: stats.total, bar: "#6e7bff" },
          { label: "Urgent", value: stats.urgent, bar: "#ff6b6b" },
          { label: "Open", value: stats.open, bar: "#fbbf24" },
          { label: "Resolved", value: stats.resolved, bar: "#34d399" },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ "--bar": s.bar } as CSSProperties}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <ImportPanel onImported={load} />
      <FilterBar value={filters} onChange={setFilters} />

      <p className="count muted">{tickets.length} ticket(s)</p>

      <TicketList
        tickets={tickets}
        loading={loading}
        onSelect={setDetail}
        onEdit={setEditing}
        onClassify={handleClassify}
        onDelete={handleDelete}
      />

      {formOpen && (
        <TicketForm onSubmit={handleCreate} onClose={() => setFormOpen(false)} />
      )}
      {editing && (
        <TicketForm initial={editing} onSubmit={handleUpdate} onClose={() => setEditing(null)} />
      )}
      {detail && (
        <TicketDetail ticket={detail} onClose={() => setDetail(null)} onClassify={handleClassify} />
      )}
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}
