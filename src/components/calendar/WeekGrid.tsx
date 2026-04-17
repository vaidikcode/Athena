"use client";

import { useMemo } from "react";
import type { CalEvent } from "./types";
import { TYPE_COLORS, ENERGY_DOT, isSameDay, eventTouchesDay } from "./types";

interface Props {
  currentDate: Date;
  events: CalEvent[];
  onEventClick: (e: CalEvent) => void;
  conflicts: Array<[CalEvent, CalEvent]>;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ROW_HEIGHT = 48; // px per hour
const TIME_COL_W = 48;

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

interface PositionedEvent {
  event: CalEvent;
  top: number;
  height: number;
  left: string;
  width: string;
  isConflict: boolean;
}

function positionEvents(dayEvents: CalEvent[], conflicts: Array<[CalEvent, CalEvent]>, day: Date): PositionedEvent[] {
  const conflictIds = new Set(conflicts.flatMap(([a, b]) => [a.id, b.id]));
  const sorted = [...dayEvents].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  // Simple column assignment for overlaps
  const columns: CalEvent[][] = [];
  const eventToCol = new Map<string, number>();

  for (const ev of sorted) {
    const evStart = new Date(ev.startAt).getTime();
    const evEnd = new Date(ev.endAt).getTime();
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const lastInCol = columns[col][columns[col].length - 1];
      if (new Date(lastInCol.endAt).getTime() <= evStart) {
        columns[col].push(ev);
        eventToCol.set(ev.id, col);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([ev]);
      eventToCol.set(ev.id, columns.length - 1);
    }
    void evEnd;
  }

  const numCols = columns.length || 1;

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  return sorted.map((ev) => {
    const rawStart = new Date(ev.startAt).getTime();
    const rawEnd = new Date(ev.endAt).getTime();
    const clipStart = new Date(Math.max(rawStart, dayStart.getTime()));
    const clipEnd = new Date(Math.min(rawEnd, dayEnd.getTime()));
    const startMinutes = clipStart.getHours() * 60 + clipStart.getMinutes();
    const endMinutes = clipEnd.getHours() * 60 + clipEnd.getMinutes();
    const durationMinutes = Math.max(endMinutes - startMinutes, 15);
    const col = eventToCol.get(ev.id) ?? 0;

    const top = (startMinutes / 60) * ROW_HEIGHT;
    const height = (durationMinutes / 60) * ROW_HEIGHT;
    const leftPct = (col / numCols) * 100;
    const widthPct = (1 / numCols) * 100;

    return {
      event: ev,
      top,
      height,
      left: `${leftPct}%`,
      width: `calc(${widthPct}% - 2px)`,
      isConflict: conflictIds.has(ev.id),
    };
  });
}

export function WeekGrid({ currentDate, events, onEventClick, conflicts }: Props) {
  const today = new Date();
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const eventsForDay = (day: Date) =>
    events.filter((e) => eventTouchesDay(e.startAt, e.endAt, day));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header row with day names */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--surface-border)", flexShrink: 0 }}>
        <div style={{ width: TIME_COL_W, flexShrink: 0 }} />
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "6px 0", borderLeft: "1px solid var(--surface-border)" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-subtle)", letterSpacing: "0.06em" }}>
                {DAY_LABELS[day.getDay()]}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 16,
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? "var(--agent)" : "var(--ink)",
                  lineHeight: 1.2,
                }}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        <div style={{ display: "flex", minHeight: 24 * ROW_HEIGHT }}>
          {/* Time column */}
          <div style={{ width: TIME_COL_W, flexShrink: 0, position: "relative" }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="mono"
                style={{
                  height: ROW_HEIGHT,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-end",
                  paddingRight: 8,
                  paddingTop: 2,
                  fontSize: 10,
                  color: "var(--ink-faint)",
                  borderTop: "1px solid var(--surface-border)",
                }}
              >
                {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, di) => {
            const dayEvs = eventsForDay(day);
            const positioned = positionEvents(dayEvs, conflicts, day);

            return (
              <div
                key={di}
                style={{
                  flex: 1,
                  position: "relative",
                  borderLeft: "1px solid var(--surface-border)",
                }}
              >
                {/* Hour lines */}
                {HOURS.map((h) => (
                  <div key={h} style={{ height: ROW_HEIGHT, borderTop: "1px solid var(--surface-border)" }} />
                ))}

                {/* Events */}
                {positioned.map(({ event: ev, top, height, left, width, isConflict }) => {
                  const colors = TYPE_COLORS[ev.type] ?? TYPE_COLORS.other;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => onEventClick(ev)}
                      style={{
                        position: "absolute",
                        top,
                        height: Math.max(height, 20),
                        left,
                        width,
                        background: isConflict
                          ? `linear-gradient(135deg, ${colors.bg} 60%, #3b1a1a)`
                          : colors.bg,
                        borderLeft: `3px solid ${isConflict ? "#e63946" : colors.border}`,
                        borderRadius: 3,
                        padding: "2px 5px",
                        cursor: "pointer",
                        overflow: "hidden",
                        zIndex: 1,
                        opacity: ev.status === "cancelled" ? 0.4 : 1,
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ fontSize: 10, color: colors.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ev.source === "agent" && <span style={{ marginRight: 3, opacity: 0.8 }}>✦</span>}
                        {ev.title}
                      </div>
                      <div className="mono" style={{ fontSize: 9, color: "var(--ink-faint)", marginTop: 1 }}>
                        {new Date(ev.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                        {" · "}
                        <span style={{ color: ENERGY_DOT[ev.energyCost] }}>●</span>
                        {" "}{ev.energyCost}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
