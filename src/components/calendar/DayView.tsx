"use client";

import { useMemo, useLayoutEffect, useRef } from "react";
import type { CalEvent } from "./types";
import { TYPE_COLORS, ENERGY_DOT, isSameDay, eventTouchesDay } from "./types";

interface Props {
  currentDate: Date;
  events: CalEvent[];
  onEventClick: (e: CalEvent) => void;
  conflicts: Array<[CalEvent, CalEvent]>;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ROW_HEIGHT = 56;
const TIME_COL_W = 52;

interface PositionedEvent {
  event: CalEvent;
  top: number;
  height: number;
  left: string;
  width: string;
  isConflict: boolean;
}

function positionDayEvents(
  events: CalEvent[],
  conflicts: Array<[CalEvent, CalEvent]>,
  day: Date
): PositionedEvent[] {
  const conflictIds = new Set(conflicts.flatMap(([a, b]) => [a.id, b.id]));
  const sorted = [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const columns: CalEvent[][] = [];
  const eventToCol = new Map<string, number>();

  for (const ev of sorted) {
    const evStart = new Date(ev.startAt).getTime();
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
    const startMin = clipStart.getHours() * 60 + clipStart.getMinutes();
    const endMin = clipEnd.getHours() * 60 + clipEnd.getMinutes();
    const durationMin = Math.max(endMin - startMin, 15);
    const col = eventToCol.get(ev.id) ?? 0;

    return {
      event: ev,
      top: (startMin / 60) * ROW_HEIGHT,
      height: (durationMin / 60) * ROW_HEIGHT,
      left: `${(col / numCols) * 100}%`,
      width: `calc(${(1 / numCols) * 100}% - 4px)`,
      isConflict: conflictIds.has(ev.id),
    };
  });
}

export function DayView({ currentDate, events, onEventClick, conflicts }: Props) {
  const today = new Date();
  const isToday = isSameDay(currentDate, today);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dayEvents = useMemo(
    () => events.filter((e) => eventTouchesDay(e.startAt, e.endAt, currentDate)),
    [events, currentDate]
  );
  const positioned = useMemo(
    () => positionDayEvents(dayEvents, conflicts, currentDate),
    [dayEvents, conflicts, currentDate]
  );

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || positioned.length === 0) return;
    const minTop = Math.min(...positioned.map((p) => p.top));
    el.scrollTop = Math.max(0, minTop - 16);
  }, [positioned]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Day header */}
      <div style={{
        padding: "10px 20px",
        borderBottom: "1px solid var(--surface-border)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
      }}>
        <div
          className="mono"
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: isToday ? "var(--agent)" : "var(--ink)",
            lineHeight: 1,
          }}
        >
          {currentDate.getDate()}
        </div>
        <div>
          <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>
            {currentDate.toLocaleString("default", { weekday: "long" })}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-subtle)" }}>
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-subtle)", padding: "3px 8px", border: "1px solid var(--surface-border)", borderRadius: 4 }}>
            {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Scrollable timeline */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ display: "flex", minHeight: 24 * ROW_HEIGHT }}>
          {/* Time column */}
          <div style={{ width: TIME_COL_W, flexShrink: 0 }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="mono"
                style={{
                  height: ROW_HEIGHT,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-end",
                  paddingRight: 10,
                  paddingTop: 3,
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  borderTop: "1px solid var(--surface-border)",
                }}
              >
                {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {/* Event column */}
          <div style={{ flex: 1, position: "relative", borderLeft: "1px solid var(--surface-border)" }}>
            {HOURS.map((h) => (
              <div key={h} style={{ height: ROW_HEIGHT, borderTop: "1px solid var(--surface-border)" }} />
            ))}

            {positioned.map(({ event: ev, top, height, left, width, isConflict }) => {
              const colors = TYPE_COLORS[ev.type] ?? TYPE_COLORS.other;
              const startStr = new Date(ev.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
              const endStr = new Date(ev.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

              return (
                <div
                  key={ev.id}
                  onClick={() => onEventClick(ev)}
                  style={{
                    position: "absolute",
                    top,
                    height: Math.max(height, 24),
                    left: `calc(${left} + 4px)`,
                    width,
                    background: isConflict
                      ? `linear-gradient(135deg, ${colors.bg} 60%, #3b1a1a)`
                      : colors.bg,
                    borderLeft: `4px solid ${isConflict ? "#e63946" : colors.border}`,
                    borderRadius: 4,
                    padding: "4px 8px",
                    cursor: "pointer",
                    overflow: "hidden",
                    zIndex: 1,
                    opacity: ev.status === "cancelled" ? 0.4 : 1,
                    boxSizing: "border-box",
                    boxShadow: isConflict ? "0 0 0 1px #e63946" : "none",
                  }}
                >
                  <div style={{ fontSize: 12, color: colors.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ev.source === "agent" && <span style={{ marginRight: 4, fontSize: 10, opacity: 0.8 }}>✦</span>}
                    {ev.title}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    {startStr} – {endStr}
                    <span style={{ color: ENERGY_DOT[ev.energyCost] }}>●</span>
                    {ev.type.replace("_", " ")}
                    {ev.priority >= 8 && <span style={{ color: "#e63946", fontSize: 9 }}>HIGH</span>}
                  </div>
                  {ev.completedAt && (
                    <div style={{ fontSize: 9, color: "#52b788", marginTop: 2 }}>✓ Done</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
