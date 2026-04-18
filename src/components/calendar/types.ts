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

/** Neo-brutalist palette */
export const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  deep_work: { bg: "#4D96FF", text: "#ffffff", border: "#000000" },
  meeting:   { bg: "#A29BFE", text: "#000000", border: "#000000" },
  admin:     { bg: "#FFD93D", text: "#000000", border: "#000000" },
  personal:  { bg: "#FFFBF0", text: "#000000", border: "#000000" },
  health:    { bg: "#FF6B6B", text: "#ffffff", border: "#000000" },
  learning:  { bg: "#6BCB77", text: "#000000", border: "#000000" },
  social:    { bg: "#FF9F43", text: "#000000", border: "#000000" },
  other:     { bg: "#f0f0f0", text: "#333333", border: "#ccc" },
};

export const ENERGY_DOT: Record<string, string> = {
  low:    "#6BCB77",
  medium: "#FFD93D",
  high:   "#FF6B6B",
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
