"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, RefreshCw, FileText, MessageSquare, Globe, Database } from "lucide-react";
import { MOCK_DATA_SOURCES, getDemoSourceEvents, type SourceId } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const SOURCE_ICONS: Record<SourceId, typeof FileText> = {
  notion:       FileText,
  slack:        MessageSquare,
  "google-docs":FileText,
  browser:      Globe,
};

export function DataSourcesPanel() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const demoEvents = useMemo(() => getDemoSourceEvents(), []);

  function mockSync(id: string) {
    setSyncing(id);
    setTimeout(() => setSyncing(null), 1200);
  }

  return (
    <div className="rounded-xl border border-surface-border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border bg-surface-base">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-brand-600 shrink-0" />
          <h3 className="text-sm font-semibold text-ink">Data sources</h3>
        </div>
        <span className="text-[11px] text-ink-faint">Auto-sync · 5 min</span>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3">
        {MOCK_DATA_SOURCES.map((src) => {
          const events = demoEvents.filter((e) => e.source === src.id);
          const isOpen = expanded === src.id;
          const isSyncing = syncing === src.id;
          const SourceIcon = SOURCE_ICONS[src.id as SourceId];

          return (
            <div key={src.id} className="overflow-hidden rounded-lg border border-surface-border bg-surface-base">
              <button
                type="button"
                className="flex w-full items-center gap-2.5 p-3 transition-colors hover:bg-surface-border/30"
                onClick={() => setExpanded(isOpen ? null : src.id)}
              >
                <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold", src.color)}>
                  {src.abbr}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate text-xs font-semibold text-ink">{src.label}</div>
                  <div className="flex items-center gap-1 text-[10px] text-ink-faint">
                    <div className="size-1.5 shrink-0 rounded-full bg-brand-600" />
                    {isSyncing ? "Syncing…" : src.lastSync}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-ink">{src.eventCount}</span>
                  {isOpen ? <ChevronUp className="size-3 text-ink-faint" /> : <ChevronDown className="size-3 text-ink-faint" />}
                </div>
              </button>

              {isOpen && (
                <div className="space-y-1.5 border-t border-surface-border bg-white px-3 py-2.5">
                  {events.map((ev) => {
                    const EvIcon = SOURCE_ICONS[ev.source as SourceId];
                    return (
                      <div key={ev.id} className="flex items-start gap-2">
                        <span className="mt-0.5 flex shrink-0 text-ink-subtle">
                          <EvIcon className="size-3.5" />
                        </span>
                        <div>
                          <div className="text-[11px] font-medium text-ink">{ev.title}</div>
                          <div className="text-[10px] text-ink-faint">
                            {ev.date} · {ev.time} · {ev.duration}min
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => mockSync(src.id)}
                    className="mt-1 flex items-center gap-1 text-[11px] text-ink-faint transition-colors hover:text-brand-600"
                  >
                    <RefreshCw className={cn("size-2.5", isSyncing && "animate-spin")} />
                    {isSyncing ? "Syncing…" : "Sync now"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
