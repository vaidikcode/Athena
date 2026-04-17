// Client-side calendar event type (mirrors DB shape with Date as string for JSON)
export interface CalEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  timezone?: string | null;
  color?: string | null;
  status: "confirmed" | "tentative" | "cancelled";
  attendees?: string[];
  type: "deep_work" | "meeting" | "admin" | "personal" | "health" | "learning" | "social" | "other";
  energyCost: "low" | "medium" | "high";
  priority: number;
  tags?: string[];
  linkedRuleId?: string | null;
  justification?: string | null;
  source: "user" | "agent";
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  completedAt?: string | null;
  outcomeNotes?: string | null;
  recurrenceParentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalEventLog {
  id: string;
  eventId: string;
  at: string;
  action: "created" | "updated" | "completed" | "cancelled" | "rescheduled" | "annotated";
  actor: "user" | "agent";
  diff?: Record<string, unknown> | null;
  note?: string | null;
}

export type CalView = "month" | "week" | "day";

// ── Color helpers ────────────────────────────────────────────────────────────
export const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  deep_work:  { bg: "#1e3a5f",  text: "#7ec8e3", border: "#2563eb" },
  meeting:    { bg: "#3b1f2b",  text: "#f4a261", border: "#e76f51" },
  admin:      { bg: "#1e2a1e",  text: "#a8d8a8", border: "#52b788" },
  personal:   { bg: "#2a1a3e",  text: "#c9b1ff", border: "#9d4edd" },
  health:     { bg: "#1f3024",  text: "#b7e4c7", border: "#40916c" },
  learning:   { bg: "#2a2310",  text: "#ffd166", border: "#f4d35e" },
  social:     { bg: "#2a1a1a",  text: "#ffb3b3", border: "#e63946" },
  other:      { bg: "#1f1f2e",  text: "#b0b3d6", border: "#4a4e69" },
};

export const ENERGY_DOT: Record<string, string> = {
  low: "#52b788",
  medium: "#f4d35e",
  high: "#e63946",
};

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/** True if [startAt, endAt] intersects the calendar day of `day` (local midnight–end). */
export function eventTouchesDay(startAt: string | Date, endAt: string | Date, day: Date): boolean {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  const s = new Date(startAt).getTime();
  const e = new Date(endAt).getTime();
  return s <= dayEnd.getTime() && e >= dayStart.getTime();
}
