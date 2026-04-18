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

/** White + Green palette */
export const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  deep_work: { bg: "#16a34a", text: "#ffffff", border: "#15803d" },
  meeting:   { bg: "#4ade80", text: "#14532d", border: "#22c55e" },
  admin:     { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" },
  personal:  { bg: "#f0fdf4", text: "#16a34a", border: "#dcfce7" },
  health:    { bg: "#15803d", text: "#ffffff", border: "#14532d" },
  learning:  { bg: "#86efac", text: "#14532d", border: "#4ade80" },
  social:    { bg: "#bbf7d0", text: "#15803d", border: "#86efac" },
  other:     { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
};

export const ENERGY_DOT: Record<string, string> = {
  low:    "#86efac",
  medium: "#22c55e",
  high:   "#15803d",
};

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
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
