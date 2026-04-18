"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, AlertTriangle, CalendarDays } from "lucide-react";
import Link from "next/link";
import { DayTimeline } from "./widgets/DayTimeline";
import { LoadChart } from "./widgets/LoadChart";
import type { CalEvent } from "@/components/calendar/types";

function todayRange() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return {
    from: new Date(`${y}-${m}-${day}T00:00:00`).toISOString(),
    to: new Date(`${y}-${m}-${day}T23:59:59.999`).toISOString(),
  };
}

async function fetchToday(): Promise<CalEvent[]> {
  const { from, to } = todayRange();
  const res = await fetch(`/api/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  if (!res.ok) return [];
  return res.json();
}

function computeLoad(events: CalEvent[]) {
  const totalMinutesByType: Record<string, number> = {};
  let backToBackCount = 0;
  let highPriorityCount = 0;
  const sorted = [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];
    const mins = Math.round((new Date(ev.endAt).getTime() - new Date(ev.startAt).getTime()) / 60000);
    totalMinutesByType[ev.type] = (totalMinutesByType[ev.type] ?? 0) + mins;
    if (ev.priority >= 8) highPriorityCount++;
    if (i > 0) {
      const gap = new Date(ev.startAt).getTime() - new Date(sorted[i - 1].endAt).getTime();
      if (gap <= 5 * 60 * 1000) backToBackCount++;
    }
  }
  return { totalMinutesByType, backToBackCount, highPriorityCount, totalEvents: events.length };
}

function findConflicts(events: CalEvent[]): Array<[CalEvent, CalEvent]> {
  const pairs: Array<[CalEvent, CalEvent]> = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j];
      if (new Date(a.startAt) < new Date(b.endAt) && new Date(b.startAt) < new Date(a.endAt)) {
        pairs.push([a, b]);
      }
    }
  }
  return pairs;
}

export function TodayRail() {
  const today = new Date().toISOString().slice(0, 10);
  const range = todayRange();

  const { data: events = [] } = useQuery({
    queryKey: ["calendar-events", range.from, range.to],
    queryFn: fetchToday,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const load = useMemo(() => computeLoad(events), [events]);
  const conflicts = useMemo(() => findConflicts(events), [events]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-brand-600 shrink-0" />
          <span className="text-xs font-semibold text-ink">Today</span>
          <span className="text-xs text-ink-faint">·</span>
          <span className="text-xs text-ink-faint">
            {new Date().toLocaleDateString([], { month: "short", day: "numeric" })}
          </span>
        </div>
        <Link
          href="/calendar"
          className="flex items-center gap-1 text-[11px] text-ink-faint hover:text-brand-600 transition-colors"
        >
          <ExternalLink className="size-3" />
          Full
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {conflicts.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
            <p className="text-xs font-semibold text-red-700">
              {conflicts.length} conflict{conflicts.length > 1 ? "s" : ""}
            </p>
          </div>
        )}

        <DayTimeline events={events} date={today} />
        <LoadChart load={load} />
      </div>
    </div>
  );
}
