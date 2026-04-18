"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CalEvent } from "@/components/calendar/types";
import { TYPE_COLORS, formatTime, isSameDay } from "@/components/calendar/types";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ROW_H = 44;
const TIME_W = 40;

interface Positioned {
  event: CalEvent;
  top: number;
  height: number;
  left: number;
  width: number;
  isConflict: boolean;
}

function position(events: CalEvent[], day: Date): Positioned[] {
  const conflictIds = new Set<string>();
  const sorted = [...events]
    .filter((e) => !e.allDay)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (
        new Date(sorted[i].startAt) < new Date(sorted[j].endAt) &&
        new Date(sorted[j].startAt) < new Date(sorted[i].endAt)
      ) {
        conflictIds.add(sorted[i].id);
        conflictIds.add(sorted[j].id);
      }
    }
  }

  const cols: CalEvent[][] = [];
  const evToCol = new Map<string, number>();

  for (const ev of sorted) {
    const evStart = new Date(ev.startAt).getTime();
    let placed = false;
    for (let c = 0; c < cols.length; c++) {
      const last = cols[c][cols[c].length - 1];
      if (new Date(last.endAt).getTime() <= evStart) {
        cols[c].push(ev);
        evToCol.set(ev.id, c);
        placed = true;
        break;
      }
    }
    if (!placed) {
      evToCol.set(ev.id, cols.length);
      cols.push([ev]);
    }
  }

  const totalCols = Math.max(cols.length, 1);

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);

  return sorted
    .filter((ev) => isSameDay(new Date(ev.startAt), day) || isSameDay(new Date(ev.endAt), day))
    .map((ev) => {
      const startMins = (new Date(ev.startAt).getTime() - dayStart.getTime()) / 60000;
      const endMins = (new Date(ev.endAt).getTime() - dayStart.getTime()) / 60000;
      const durMins = Math.max(endMins - startMins, 15);
      const col = evToCol.get(ev.id) ?? 0;
      return {
        event: ev,
        top: Math.max(startMins / 60, 0) * ROW_H,
        height: Math.max((durMins / 60) * ROW_H, 18),
        left: (col / totalCols) * 100,
        width: 100 / totalCols,
        isConflict: conflictIds.has(ev.id),
      };
    });
}

interface Props {
  events: CalEvent[];
  date: string; // ISO date string like "2026-04-18"
  onEventClick?: (ev: CalEvent) => void;
}

export function DayTimeline({ events, date, onEventClick }: Props) {
  const day = new Date(date + "T00:00:00");
  const positioned = position(events, day);
  const [hovered, setHovered] = useState<string | null>(null);

  const nowMinutes = (() => {
    const n = new Date();
    if (!isSameDay(n, day)) return null;
    return n.getHours() * 60 + n.getMinutes();
  })();

  return (
    <div className="rounded-xl border border-[3px] border-black bg-white overflow-hidden shadow-sm">
      <div className="px-3 py-2.5 border-b border-surface-border bg-nb-cream">
        <p className="text-xs font-bold text-ink">
          {day.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
        </p>
        <p className="text-[11px] text-black/40">{events.length} events</p>
      </div>
      <div className="relative overflow-y-auto" style={{ maxHeight: 360 }}>
        <div style={{ position: "relative", height: HOURS.length * ROW_H + ROW_H }}>
          {/* Hour grid */}
          {HOURS.map((h) => (
            <div
              key={h}
              style={{ position: "absolute", top: h * ROW_H, left: 0, right: 0, height: ROW_H }}
              className="border-t border-surface-border/60"
            >
              <span
                className="text-black/40 select-none"
                style={{ position: "absolute", left: 4, top: 2, width: TIME_W - 8, fontSize: 10 }}
              >
                {h.toString().padStart(2, "0")}:00
              </span>
            </div>
          ))}

          {/* Now line */}
          {nowMinutes !== null && (
            <div
              style={{
                position: "absolute",
                top: (nowMinutes / 60) * ROW_H,
                left: TIME_W,
                right: 0,
                height: 2,
                background: "#4D96FF",
                opacity: 0.7,
                zIndex: 10,
              }}
            />
          )}

          {/* Events */}
          <div style={{ position: "absolute", top: 0, left: TIME_W, right: 4, bottom: 0 }}>
            {positioned.map((p) => {
              const colors = TYPE_COLORS[p.event.type] ?? TYPE_COLORS.other;
              const isHov = hovered === p.event.id;
              return (
                <button
                  key={p.event.id}
                  type="button"
                  onClick={() => onEventClick?.(p.event)}
                  onMouseEnter={() => setHovered(p.event.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    position: "absolute",
                    top: p.top,
                    height: p.height,
                    left: `${p.left}%`,
                    width: `${p.width - 1}%`,
                    background: colors.bg,
                    borderLeft: `3px solid ${p.isConflict ? "#ef4444" : colors.border}`,
                    color: colors.text,
                    zIndex: isHov ? 20 : 5,
                    transform: isHov ? "scale(1.01)" : "none",
                    transition: "transform 0.1s",
                  }}
                  className={cn(
                    "flex flex-col items-start overflow-hidden rounded-sm px-1.5 py-0.5 text-left text-[11px] font-bold shadow-sm cursor-pointer",
                    p.isConflict && "ring-1 ring-red-400"
                  )}
                >
                  <span className="truncate w-full leading-tight">{p.event.title}</span>
                  {p.height > 28 && (
                    <span className="opacity-75 leading-tight text-[10px]">
                      {formatTime(p.event.startAt)}–{formatTime(p.event.endAt)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
