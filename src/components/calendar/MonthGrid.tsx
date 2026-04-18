"use client";

import { useMemo } from "react";
import type { CalEvent } from "./types";
import { TYPE_COLORS, isSameDay } from "./types";

interface Props {
  currentDate: Date;
  events: CalEvent[];
  onEventClick: (e: CalEvent) => void;
  onDayClick: (d: Date) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE = 3;

export function MonthGrid({ currentDate, events, onEventClick, onDayClick }: Props) {
  const today = new Date();

  const { weeks } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Start from Sunday of the week containing the 1st
    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());

    const weeks: Date[][] = [];
    let cursor = new Date(start);

    while (cursor <= lastDay || weeks.length < 6) {
      if (weeks.length >= 6) break;
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }
    return { weeks };
  }, [currentDate]);

  const eventsForDay = (day: Date) => {
    return events.filter((e) => {
      const start = new Date(e.startAt);
      const end = new Date(e.endAt);
      // Include event if day falls within its range
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      return start <= dayEnd && end >= dayStart;
    });
  };

  const isCurrentMonth = (day: Date) => day.getMonth() === currentDate.getMonth();

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--surface-border)" }}>
        {DAYS.map((d) => (
          <div key={d} className="mono" style={{
            padding: "6px 0",
            textAlign: "center",
            fontSize: 11,
            color: "var(--ink-subtle)",
            letterSpacing: "0.08em",
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: wi < 5 ? "1px solid var(--surface-border)" : "none" }}>
            {week.map((day, di) => {
              const dayEvents = eventsForDay(day);
              const visible = dayEvents.slice(0, MAX_VISIBLE);
              const overflow = dayEvents.length - MAX_VISIBLE;
              const isToday = isSameDay(day, today);
              const inMonth = isCurrentMonth(day);

              return (
                <div
                  key={di}
                  onClick={() => onDayClick(day)}
                  style={{
                    borderRight: di < 6 ? "1px solid var(--surface-border)" : "none",
                    padding: "4px 6px",
                    minHeight: 0,
                    cursor: "pointer",
                    background: "transparent",
                    transition: "background 0.1s",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-overlay)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Day number */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        width: 22,
                        height: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        background: isToday ? "var(--agent)" : "transparent",
                        color: isToday ? "#fff" : inMonth ? "var(--ink)" : "var(--ink-faint)",
                        fontWeight: isToday ? 600 : 400,
                      }}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Event bars */}
                  {visible.map((ev) => {
                    const colors = TYPE_COLORS[ev.type] ?? TYPE_COLORS.other;
                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                        style={{
                          background: colors.bg,
                          borderLeft: `3px solid ${colors.border}`,
                          borderRadius: 2,
                          padding: "1px 4px",
                          fontSize: 10,
                          color: colors.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                          opacity: ev.status === "cancelled" ? 0.4 : 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                        title={ev.title}
                      >
                        {ev.source === "agent" && (
                          <span style={{ fontSize: 7, fontWeight: 600, color: "#16a34a" }}>a</span>
                        )}
                        {ev.allDay ? "" : new Date(ev.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) + " "}
                        {ev.title}
                      </div>
                    );
                  })}

                  {overflow > 0 && (
                    <div style={{ fontSize: 10, color: "var(--ink-subtle)", paddingLeft: 4 }}>
                      +{overflow} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
