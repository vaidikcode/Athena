"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "./EventCard";
import type { CalEvent } from "@/components/calendar/types";

interface Props {
  pairA: CalEvent;
  pairB: CalEvent;
  onSendMessage: (text: string) => void;
}

export function ConflictPair({ pairA, pairB, onSendMessage }: Props) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50/50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-red-200 bg-red-50">
        <AlertTriangle className="size-4 text-red-500 shrink-0" />
        <p className="text-athens-small font-semibold text-red-700">Scheduling conflict</p>
      </div>
      <div className="p-3 space-y-2">
        <EventCard event={pairA} onSendMessage={onSendMessage} compact />
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-red-200" />
          <span className="text-[11px] font-bold text-red-400">overlaps with</span>
          <div className="flex-1 h-px bg-red-200" />
        </div>
        <EventCard event={pairB} onSendMessage={onSendMessage} compact />
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-full text-xs"
            onClick={() =>
              onSendMessage(
                `Find a better slot for "${pairA.title}" (${pairA.id}) to resolve its conflict with "${pairB.title}" (${pairB.id}), and propose specific times.`
              )
            }
          >
            Move "{pairA.title}"
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-full text-xs"
            onClick={() =>
              onSendMessage(
                `Find a better slot for "${pairB.title}" (${pairB.id}) to resolve its conflict with "${pairA.title}" (${pairA.id}), and propose specific times.`
              )
            }
          >
            Move "{pairB.title}"
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded-full text-xs text-athens-blue/60"
            onClick={() =>
              onSendMessage(
                `Cancel event "${pairA.title}" (${pairA.id}) to resolve the conflict with "${pairB.title}" (${pairB.id}).`
              )
            }
          >
            Cancel A
          </Button>
        </div>
      </div>
    </div>
  );
}
