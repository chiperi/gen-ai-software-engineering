// TypeScript mirror of the backend ticket model.

export const CATEGORIES = [
  "account_access",
  "technical_issue",
  "billing_question",
  "feature_request",
  "bug_report",
  "other",
] as const;

export const PRIORITIES = ["urgent", "high", "medium", "low"] as const;

export const STATUSES = [
  "new",
  "in_progress",
  "waiting_customer",
  "resolved",
  "closed",
] as const;

export const SOURCES = ["web_form", "email", "api", "chat", "phone"] as const;
export const DEVICE_TYPES = ["desktop", "mobile", "tablet"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Status = (typeof STATUSES)[number];
export type Source = (typeof SOURCES)[number];
export type DeviceType = (typeof DEVICE_TYPES)[number];

export interface Metadata {
  source: Source;
  browser?: string | null;
  device_type?: DeviceType | null;
}

export interface Classification {
  category: Category;
  priority: Priority;
  confidence: number;
  reasoning: string;
  keywords_found: string[];
}

export interface Ticket {
  id: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  assigned_to: string | null;
  tags: string[];
  metadata: Metadata;
  classification: Classification | null;
}

export interface TicketInput {
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  assigned_to?: string | null;
  tags: string[];
  metadata: Metadata;
}

export interface ImportSummary {
  total: number;
  successful: number;
  failed: number;
  errors: { row: number; message: string }[];
  created_ids: string[];
}

export interface Filters {
  category?: Category | "";
  priority?: Priority | "";
  status?: Status | "";
}
