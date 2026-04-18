"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarDays, Check, Clock, Edit3, Trash2, X } from "lucide-react";
import type { CalEvent } from "@/components/calendar/types";
import { TYPE_COLORS, formatTime } from "@/components/calendar/types";

interface Props {
  event: CalEvent;
  onReschedule?: (ev: CalEvent) => void;
  onSendMessage?: (text: string) => void;
  onClose?: () => void;
  compact?: boolean;
}

export function EventCard({ event, onReschedule, onSendMessage, onClose, compact }: Props) {
  const [confirming, setConfirming] = useState<"cancel" | "complete" | null>(null);
  const colors = TYPE_COLORS[event.type] ?? TYPE_COLORS.other;

  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);

  return (
    <div className={cn("rounded-xl border border-surface-border bg-white overflow-hidden shadow-sm", compact && "text-sm")}>
      {/* Color accent bar */}
      <div className="h-1 w-full bg-brand-600" />
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-ink truncate leading-snug">{event.title}</p>
            <p className="text-xs text-ink-subtle mt-0.5">
              <CalendarDays className="inline-block size-3 mr-1 opacity-70" />
              {start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
              {" · "}
              <Clock className="inline-block size-3 mr-1 opacity-70" />
              {formatTime(event.startAt)}–{formatTime(event.endAt)}
              {" · "}{durationMin} min
            </p>
            {event.description && !compact && (
              <p className="text-xs text-ink-subtle mt-1.5 leading-relaxed line-clamp-2">{event.description}</p>
            )}
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="shrink-0 text-ink-faint hover:text-ink transition-colors">
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="mt-2 flex gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200">
            {event.type.replace("_", " ")}
          </span>
          <span className="text-[11px] font-medium rounded-full px-2 py-0.5 bg-surface-base text-ink-subtle border border-surface-border">
            {event.energyCost} energy
          </span>
          <span className="text-[11px] font-medium rounded-full px-2 py-0.5 bg-surface-base text-ink-subtle border border-surface-border">
            p{event.priority}
          </span>
          {event.completedAt && (
            <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 bg-brand-600 text-white">
              completed
            </span>
          )}
        </div>

        {!compact && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-surface-border pt-3">
            {!event.completedAt && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 rounded-full text-xs"
                  onClick={() => onReschedule?.(event)}
                >
                  <Edit3 className="size-3" />
                  Reschedule
                </Button>
                {confirming === "complete" ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-7 rounded-full text-xs"
                      onClick={() => {
                        onSendMessage?.(`Mark event "${event.title}" (${event.id}) as complete.`);
                        setConfirming(null);
                      }}
                    >
                      <Check className="size-3" />
                      Confirm
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 rounded-full text-xs" onClick={() => setConfirming(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full text-xs"
                    onClick={() => setConfirming("complete")}
                  >
                    <Check className="size-3" />
                    Complete
                  </Button>
                )}
                {confirming === "cancel" ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 rounded-full text-xs"
                      onClick={() => {
                        onSendMessage?.(`Cancel event "${event.title}" (${event.id}).`);
                        setConfirming(null);
                      }}
                    >
                      Confirm cancel
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 rounded-full text-xs" onClick={() => setConfirming(null)}>
                      Keep
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-full text-xs text-ink-faint"
                    onClick={() => setConfirming("cancel")}
                  >
                    <Trash2 className="size-3" />
                    Cancel event
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
