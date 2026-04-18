"use client";

import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export interface SlotCandidate {
  startIso: string;
  endIso: string;
  score?: number;
  reason?: string;
}

interface Props {
  eventId: string;
  eventTitle?: string;
  candidates: SlotCandidate[];
  onSelect: (slot: SlotCandidate) => void;
}

export function SlotPicker({ eventId, eventTitle, candidates, onSelect }: Props) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-[3px] border-black bg-white px-4 py-3 text-xs text-ink-subtle">
        No free slots found in this window.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[3px] border-black bg-white overflow-hidden shadow-sm">
      <div className="px-3.5 py-2.5 border-b border-surface-border bg-nb-cream">
        <p className="text-xs font-bold text-ink">
          {eventTitle ? `Reschedule "${eventTitle}"` : `Reschedule event ${eventId}`}
        </p>
        <p className="text-[11px] text-ink-faint mt-0.5">Pick a slot below — tap to move</p>
      </div>
      <div className="flex flex-wrap gap-2 p-3">
        {candidates.map((s, i) => {
          const start = new Date(s.startIso);
          const end = new Date(s.endIso);
          const dur = Math.round((end.getTime() - start.getTime()) / 60000);
          return (
            <Button
              key={i}
              variant="secondary"
              size="sm"
              className="flex h-auto flex-col items-start rounded-lg px-3 py-2 text-left gap-0.5"
              onClick={() => onSelect(s)}
            >
              <span className="flex items-center gap-1 font-bold text-nb-blue">
                <Clock className="size-3" />
                {start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
              </span>
              <span className="text-[11px] text-ink-subtle">
                {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                –{end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                {" · "}{dur} min
              </span>
              {s.reason && (
                <span className="text-[11px] text-ink-faint font-normal leading-tight max-w-[160px] whitespace-normal">
                  {s.reason}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
