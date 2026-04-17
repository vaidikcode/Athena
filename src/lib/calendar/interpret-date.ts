/**
 * Calendar tool / API date parsing.
 *
 * `new Date("2026-04-18")` is UTC midnight, which maps to the *previous* calendar day
 * in positive-offset timezones — events then miss the local "today" list query.
 * Date-only strings are interpreted as **local** wall time on that calendar day.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function interpretCalendarInstant(s: string): Date {
  const t = s.trim();
  if (DATE_ONLY.test(t)) {
    const [y, mo, d] = t.split("-").map(Number);
    return new Date(y, mo - 1, d, 9, 0, 0, 0);
  }
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date string: ${s}`);
  }
  return d;
}

/** Ensures end is strictly after start (default +1h) for create/update flows. */
export function normalizeEventRange(startStr: string, endStr: string): { startAt: Date; endAt: Date } {
  let startAt = interpretCalendarInstant(startStr);
  let endAt = interpretCalendarInstant(endStr);
  if (endAt.getTime() <= startAt.getTime()) {
    endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  }
  return { startAt, endAt };
}
