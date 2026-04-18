"use client";

import { useState, useCallback } from "react";
import { Flame } from "lucide-react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RulesRail } from "./RulesRail";
import { Thread } from "./Thread";
import { TodayRail } from "./TodayRail";
import { MOCK_METRICS } from "@/lib/mock/data";

export function ConsoleLayout() {
  const today = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const [sendFn, setSendFn] = useState<((text: string) => void) | null>(null);

  const handleSendReady = useCallback((fn: (text: string) => void) => {
    setSendFn(() => fn);
  }, []);

  return (
    <QueryProvider>
      <div className="flex h-full min-h-0 flex-col bg-nb-cream">
        {/* Top bar — neo-brutalist header */}
        <div className="flex shrink-0 items-center justify-between border-b-[3px] border-black bg-nb-blue px-5 py-3 shadow-[0px_3px_0px_0px_#000]">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-2.5 rounded-full bg-nb-yellow border-[2px] border-black animate-pulse" />
            <span className="text-sm font-black text-white">{today}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border-[3px] border-black bg-nb-yellow px-3 py-1 shadow-nb-sm">
            <Flame className="size-3.5 text-black" />
            <span className="text-xs font-black text-black">{MOCK_METRICS.streakDays} day streak</span>
          </div>
        </div>

        {/* 3-column body */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left: Actions + Sources + Rules */}
          <div className="w-56 shrink-0 border-r-[3px] border-black bg-white flex flex-col overflow-hidden">
            <RulesRail onSend={sendFn ?? undefined} />
          </div>

          {/* Center: Thread */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-nb-cream">
            <Thread onSendReady={handleSendReady} />
          </div>

          {/* Right: Today */}
          <div className="w-72 shrink-0 border-l-[3px] border-black bg-white flex flex-col overflow-hidden">
            <TodayRail />
          </div>
        </div>
      </div>
    </QueryProvider>
  );
}
