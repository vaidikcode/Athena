"use client";

import { useState, useCallback, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { CalendarShell } from "@/components/calendar/CalendarShell";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { WeekGrid } from "@/components/calendar/WeekGrid";
import { DayView } from "@/components/calendar/DayView";
import { EventDialog } from "@/components/calendar/EventDialog";
import { EventInspector } from "@/components/calendar/EventInspector";
import type { CalEvent, CalView } from "@/components/calendar/types";

function getWindowForView(view: CalView, date: Date): { from: Date; to: Date } {
  if (view === "month") {
    const from = new Date(date.getFullYear(), date.getMonth(), 1);
    from.setDate(from.getDate() - from.getDay()); // start of first week
    const to = new Date(from);
    to.setDate(to.getDate() + 42); // 6 weeks
    return { from, to };
  }
  if (view === "week") {
    const from = new Date(date);
    from.setDate(date.getDate() - date.getDay());
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }
  // day
  const from = new Date(date);
  from.setHours(0, 0, 0, 0);
  const to = new Date(date);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function navigate(view: CalView, date: Date, dir: -1 | 1): Date {
  const d = new Date(date);
  if (view === "month") {
    d.setMonth(d.getMonth() + dir);
    d.setDate(1);
  } else if (view === "week") {
    d.setDate(d.getDate() + dir * 7);
  } else {
    d.setDate(d.getDate() + dir);
  }
  return d;
}

async function fetchEvents(from: Date, to: Date): Promise<CalEvent[]> {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const res = await fetch(`/api/calendar/events?${params}`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchConflicts(from: Date, to: Date): Promise<Array<[CalEvent, CalEvent]>> {
  const params = new URLSearchParams({ windowStart: from.toISOString(), windowEnd: to.toISOString() });
  const res = await fetch(`/api/calendar/events/conflicts?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function CalendarPage() {
  const [view, setView] = useState<CalView>("month");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [dialogDefaultDate, setDialogDefaultDate] = useState<Date | undefined>();

  const qc = useQueryClient();

  const { from, to } = useMemo(() => getWindowForView(view, currentDate), [view, currentDate]);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["calendar-events", from.toISOString(), to.toISOString()],
    queryFn: () => fetchEvents(from, to),
    staleTime: 30_000,
  });

  // Compute conflicts client-side (avoids extra API route)
  const conflicts = useMemo((): Array<[CalEvent, CalEvent]> => {
    const pairs: Array<[CalEvent, CalEvent]> = [];
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const a = events[i];
        const b = events[j];
        if (new Date(a.startAt) < new Date(b.endAt) && new Date(b.startAt) < new Date(a.endAt)) {
          pairs.push([a, b]);
        }
      }
    }
    return pairs;
  }, [events]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["calendar-events"] });

  const handleSave = async (data: Partial<CalEvent>) => {
    if (editingEvent) {
      await fetch(`/api/calendar/events/${editingEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setShowDialog(false);
    setEditingEvent(null);
    await invalidate();
  };

  const handleEventClick = useCallback((ev: CalEvent) => {
    setSelectedEvent(ev);
  }, []);

  const handleDayClick = (d: Date) => {
    if (view === "month") {
      setCurrentDate(d);
      setView("day");
    } else {
      setDialogDefaultDate(d);
      setEditingEvent(null);
      setShowDialog(true);
    }
  };

  const handleEdit = (ev: CalEvent) => {
    setEditingEvent(ev);
    setShowDialog(true);
    setSelectedEvent(null);
  };

  const handleDelete = async () => {
    setSelectedEvent(null);
    await invalidate();
  };

  const handleComplete = async () => {
    await invalidate();
    // Refresh the selected event data
    if (selectedEvent) {
      const res = await fetch(`/api/calendar/events/${selectedEvent.id}`);
      if (res.ok) setSelectedEvent(await res.json());
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
      <TopBar title="Calendar" />
      <CalendarShell
        view={view}
        onViewChange={setView}
        currentDate={currentDate}
        onPrev={() => setCurrentDate((d) => navigate(view, d, -1))}
        onNext={() => setCurrentDate((d) => navigate(view, d, 1))}
        onToday={() => setCurrentDate(new Date())}
        onNewEvent={() => {
          setEditingEvent(null);
          setDialogDefaultDate(currentDate);
          setShowDialog(true);
        }}
      />

      {/* Conflict badge */}
      {conflicts.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 border-b border-athens-stone bg-athens-highlight px-4 py-2 text-xs font-semibold text-athens-blue">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          {conflicts.length} scheduling conflict{conflicts.length > 1 ? "s" : ""} detected
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Main calendar area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {isLoading && (
            <div className="mono" style={{ padding: "12px 16px", fontSize: 11, color: "var(--ink-faint)" }}>
              Loading events…
            </div>
          )}

          {view === "month" && (
            <MonthGrid
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          )}

          {view === "week" && (
            <WeekGrid
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              conflicts={conflicts}
            />
          )}

          {view === "day" && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              conflicts={conflicts}
            />
          )}
        </div>

        {/* Event inspector panel */}
        {selectedEvent && (
          <EventInspector
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onComplete={handleComplete}
          />
        )}
      </div>

      {/* Event dialog */}
      {showDialog && (
        <EventDialog
          event={editingEvent}
          defaultDate={dialogDefaultDate}
          onSave={handleSave}
          onClose={() => { setShowDialog(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
}
