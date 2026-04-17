"use client";

import type { CalView } from "./types";

interface Props {
  view: CalView;
  onViewChange: (v: CalView) => void;
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewEvent: () => void;
}

function formatHeader(view: CalView, date: Date): string {
  if (view === "month") {
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  }
  if (view === "week") {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleString("default", { month: "short", day: "numeric" })} – ${end.toLocaleString("default", { month: "short", day: "numeric", year: "numeric" })}`;
  }
  return date.toLocaleString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function CalendarShell({ view, onViewChange, currentDate, onPrev, onNext, onToday, onNewEvent }: Props) {
  const views: CalView[] = ["month", "week", "day"];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 20px",
      borderBottom: "1px solid var(--surface-border)",
      background: "var(--surface-raised)",
      gap: 12,
    }}>
      {/* Left: nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onPrev} style={navBtnStyle}>‹</button>
        <button onClick={onToday} style={{ ...navBtnStyle, fontSize: 12 }}>Today</button>
        <button onClick={onNext} style={navBtnStyle}>›</button>
        <span className="mono" style={{ fontSize: 14, color: "var(--ink)", marginLeft: 8, fontWeight: 500 }}>
          {formatHeader(view, currentDate)}
        </span>
      </div>

      {/* Right: view switcher + new event */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", border: "1px solid var(--surface-border)", borderRadius: 4, overflow: "hidden" }}>
          {views.map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              style={{
                padding: "5px 14px",
                fontSize: 12,
                background: view === v ? "var(--surface-overlay)" : "transparent",
                color: view === v ? "var(--ink)" : "var(--ink-subtle)",
                border: "none",
                cursor: "pointer",
                fontWeight: view === v ? 500 : 400,
                borderRight: v !== "day" ? "1px solid var(--surface-border)" : "none",
                textTransform: "capitalize",
              }}
            >
              {v}
            </button>
          ))}
        </div>

        <button
          onClick={onNewEvent}
          style={{
            padding: "6px 14px",
            fontSize: 12,
            background: "var(--agent)",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          + New Event
        </button>
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--surface-border)",
  borderRadius: 4,
  padding: "4px 10px",
  cursor: "pointer",
  color: "var(--ink-subtle)",
  fontSize: 16,
  lineHeight: 1,
};
