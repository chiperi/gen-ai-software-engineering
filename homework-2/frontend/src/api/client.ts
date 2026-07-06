// Typed wrapper around the ticket REST API. All calls go through `/api/*`,
// which Vite proxies to the FastAPI backend. No ticket data is hardcoded.

import type {
  Filters,
  ImportSummary,
  Ticket,
  TicketInput,
} from "../types";

const BASE = "/api";

export class ApiError extends Error {
  details: { field?: string; message: string }[];
  constructor(message: string, details: { field?: string; message: string }[] = []) {
    super(message);
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError("Cannot reach the API. Is the backend running on :3000?");
  }
  if (resp.status === 204) return undefined as T;
  const body = await resp.json().catch(() => null);
  if (!resp.ok) {
    // A 5xx with no JSON body usually means the dev proxy could not reach the
    // backend — surface a helpful message instead of a bare status code.
    const message =
      body?.error ??
      (resp.status >= 500
        ? "Cannot reach the API. Is the backend running on :3000?"
        : `Request failed (${resp.status})`);
    throw new ApiError(message, body?.details ?? []);
  }
  return body as T;
}

function query(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.status) params.set("status", filters.status);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const api = {
  list: (filters: Filters = {}) => request<Ticket[]>(`/tickets${query(filters)}`),
  get: (id: string) => request<Ticket>(`/tickets/${id}`),
  create: (input: TicketInput, autoClassify = false) =>
    request<Ticket>(`/tickets${autoClassify ? "?auto_classify=true" : ""}`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, changes: Partial<TicketInput>) =>
    request<Ticket>(`/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify(changes),
    }),
  remove: (id: string) => request<void>(`/tickets/${id}`, { method: "DELETE" }),
  classify: (id: string) =>
    request<Ticket>(`/tickets/${id}/auto-classify`, { method: "POST" }),
  import: async (file: File, autoClassify = false): Promise<ImportSummary> => {
    const form = new FormData();
    form.append("file", file);
    const resp = await fetch(
      `${BASE}/tickets/import${autoClassify ? "?auto_classify=true" : ""}`,
      { method: "POST", body: form },
    );
    const body = await resp.json().catch(() => null);
    if (!resp.ok) throw new ApiError(body?.error ?? "Import failed", body?.details ?? []);
    return body as ImportSummary;
  },
};
