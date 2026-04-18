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
  green:  "bg-nb-green border-[2px] border-black text-black font-black shadow-nb-sm",
  yellow: "bg-nb-yellow border-[2px] border-black text-black font-black",
  red:    "bg-nb-coral border-[2px] border-black text-white font-black",
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
    <div className="rounded-2xl border-[3px] border-black bg-white p-4 shadow-nb">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="rounded-xl border-[2px] border-black p-1 text-black/60 hover:bg-nb-yellow hover:text-black shadow-nb-sm transition-all">
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-black text-black">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth} className="rounded-xl border-[2px] border-black p-1 text-black/60 hover:bg-nb-yellow hover:text-black shadow-nb-sm transition-all">
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className="py-1 text-center text-[10px] font-black text-black/40">
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
                  "flex size-7 cursor-default items-center justify-center rounded-xl text-xs transition-all",
                  status ? DAY_COLORS[status] : "text-black/40 font-bold",
                  isToday && !status && "ring-2 ring-black ring-offset-1 ring-offset-white font-black"
                )}
              >
                {day}
              </div>
              {tooltip === iso && status && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-xl border-[2px] border-black bg-nb-yellow px-2 py-1 text-[10px] font-black text-black shadow-nb-sm">
                  {iso.slice(5)} ·{" "}
                  {status === "green" ? "≥50% done" : status === "red" ? "<50% done" : "In progress"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-3 border-t-[2px] border-black pt-3">
        {[
          { color: "bg-nb-green border-[2px] border-black", label: "On track" },
          { color: "bg-nb-yellow border-[2px] border-black", label: "In progress" },
          { color: "bg-nb-coral border-[2px] border-black", label: "Behind" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className={cn("size-2.5 rounded-full", l.color)} />
            <span className="text-[10px] font-black text-black/50">{l.label}</span>
          </div>
        ))}
      </div>

      {isThisMonth && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: "On track", count: Object.values(calendarDays).filter((v) => v === "green").length, bg: "bg-nb-green" },
            { label: "In progress", count: Object.values(calendarDays).filter((v) => v === "yellow").length, bg: "bg-nb-yellow" },
            { label: "Behind", count: Object.values(calendarDays).filter((v) => v === "red").length, bg: "bg-nb-coral" },
          ].map((s) => (
            <div key={s.label} className={cn("rounded-xl border-[2px] border-black p-2 text-center shadow-nb-sm", s.bg)}>
              <div className="text-lg font-black text-black">{s.count}</div>
              <div className="text-[10px] font-black text-black/60">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
