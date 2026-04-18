"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMockCalendarDays } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_COLORS: Record<"green" | "yellow" | "red", string> = {
  green: "bg-athens-blue text-white",
  yellow: "bg-athens-blue/50 text-white",
  red: "border border-athens-stone bg-athens-stone text-athens-blue",
};

const calendarDays = getMockCalendarDays();

export function CalendarWidget() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [tooltip, setTooltip] = useState<string | null>(null);

  const { days, firstDayOfWeek } = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const first = new Date(viewYear, viewMonth, 1).getDay();
    return { days: daysInMonth, firstDayOfWeek: first };
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  }

  const cells: Array<null | { day: number; iso: string }> = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: days }, (_, i) => {
      const d = i + 1;
      const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      return { day: d, iso };
    }),
  ];

  const todayIso = today.toISOString().split("T")[0];
  const isThisMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div className="rounded-2xl border border-athens-stone bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="rounded-lg p-1 text-athens-blue/60 hover:bg-athens-highlight">
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold text-athens-blue">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth} className="rounded-lg p-1 text-athens-blue/60 hover:bg-athens-highlight">
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className="py-1 text-center text-[10px] font-medium text-athens-blue/50">
            {l}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const { day, iso } = cell;
          const status = calendarDays[iso];
          const isToday = iso === todayIso;
          return (
            <div
              key={iso}
              className="relative flex items-center justify-center"
              onMouseEnter={() => status && setTooltip(iso)}
              onMouseLeave={() => setTooltip(null)}
            >
              <div
                className={cn(
                  "flex size-7 cursor-default items-center justify-center rounded-full text-xs font-medium transition-all",
                  status ? DAY_COLORS[status] : "text-athens-blue/40",
                  isToday && "ring-2 ring-athens-blue ring-offset-1 ring-offset-white"
                )}
              >
                {day}
              </div>
              {tooltip === iso && status && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-athens-stone bg-athens-highlight px-2 py-1 text-[10px] text-athens-blue shadow-lg">
                  {iso.slice(5)} ·{" "}
                  {status === "green" ? "≥50% tasks done" : status === "red" ? "<50% tasks done" : "In progress"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-3 border-t border-athens-stone pt-3">
        {[
          { color: "bg-athens-blue", label: "On track" },
          { color: "bg-athens-blue/50", label: "In progress" },
          { color: "bg-athens-stone", label: "Behind" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className={cn("size-2.5 rounded-full", l.color)} />
            <span className="text-[10px] text-athens-blue/60">{l.label}</span>
          </div>
        ))}
      </div>

      {isThisMonth && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: "On track", count: Object.values(calendarDays).filter((v) => v === "green").length },
            { label: "In progress", count: Object.values(calendarDays).filter((v) => v === "yellow").length },
            { label: "Behind", count: Object.values(calendarDays).filter((v) => v === "red").length },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-athens-stone bg-athens-highlight p-2 text-center">
              <div className="text-lg font-bold text-athens-blue">{s.count}</div>
              <div className="text-[10px] font-light text-athens-blue/65">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
