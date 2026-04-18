"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, RefreshCw, FileText, MessageSquare, Globe, Database, Unplug, PlugZap, X } from "lucide-react";
import { MOCK_DATA_SOURCES, getDemoSourceEvents, type SourceId } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import { useSourceConnections } from "@/lib/client/source-connections";

const SOURCE_ICONS: Record<SourceId, typeof FileText> = {
  notion:       FileText,
  slack:        MessageSquare,
  "google-docs":FileText,
  browser:      Globe,
};

/* Each source card gets a bright accent color */
const SOURCE_BG: Record<SourceId, string> = {
  notion:       "bg-nb-blue text-white",
  slack:        "bg-nb-purple text-black",
  "google-docs":"bg-nb-green text-black",
  browser:      "bg-nb-orange text-black",
};

export function DataSourcesPanel() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [revokeConfirm, setRevokeConfirm] = useState<SourceId | null>(null);
  const demoEvents = useMemo(() => getDemoSourceEvents(), []);
  const { connections, revoke, reconnect } = useSourceConnections();

  function mockSync(id: string) {
    setSyncing(id);
    setTimeout(() => setSyncing(null), 1200);
  }

  const connectedCount = MOCK_DATA_SOURCES.filter(
    (s) => connections[s.id as SourceId] ?? true
  ).length;

  return (
    <div className="rounded-2xl border-[3px] border-black bg-white overflow-hidden shadow-nb">
      <div className="flex items-center justify-between px-5 py-3 border-b-[3px] border-black bg-nb-coral">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-white shrink-0" />
          <h3 className="text-sm font-black text-white">Data sources</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-white">{connectedCount}/{MOCK_DATA_SOURCES.length} connected</span>
          <span className="text-[11px] font-bold text-white/70">· Auto-sync 5 min</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3">
        {MOCK_DATA_SOURCES.map((src) => {
          const connected = connections[src.id as SourceId] ?? true;
          const events = demoEvents.filter((e) => e.source === src.id);
          const isOpen = expanded === src.id && connected;
          const isSyncing = syncing === src.id;
          const SourceIcon = SOURCE_ICONS[src.id as SourceId];
          const confirming = revokeConfirm === src.id;

          return (
            <div
              key={src.id}
              className={cn(
                "overflow-hidden rounded-xl border-[3px] transition-all shadow-nb-sm",
                connected ? "border-black bg-white" : "border-black/30 bg-nb-cream opacity-70"
              )}
            >
              <div className="flex w-full items-center gap-2.5 p-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  onClick={() => connected && setExpanded(isOpen ? null : src.id)}
                  disabled={!connected}
                >
                  <div className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg border-[2px] border-black text-xs font-black transition-all",
                    connected ? SOURCE_BG[src.id as SourceId] : "bg-black/10 text-black/40"
                  )}>
                    {src.abbr}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate text-xs font-black", connected ? "text-black" : "text-black/40 line-through")}>
                      {src.label}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-black/50">
                      <div className={cn("size-1.5 shrink-0 rounded-full", connected ? "bg-nb-green" : "bg-black/30")} />
                      {connected
                        ? (isSyncing ? "Syncing…" : src.lastSync)
                        : "Access revoked"}
                    </div>
                  </div>
                </button>

                {/* Actions */}
                {connected ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-black text-black mr-1">{src.eventCount}</span>
                    {isOpen
                      ? <ChevronUp className="size-3 text-black/50" />
                      : <ChevronDown className="size-3 text-black/50 cursor-pointer" onClick={() => setExpanded(src.id)} />
                    }
                    {confirming ? (
                      <>
                        <button
                          type="button"
                          onClick={() => { revoke(src.id as SourceId); setRevokeConfirm(null); setExpanded(null); }}
                          className="text-[10px] font-black text-white bg-nb-coral border border-black rounded px-1.5 py-0.5 transition-colors shadow-nb-sm"
                        >
                          Revoke
                        </button>
                        <button
                          type="button"
                          onClick={() => setRevokeConfirm(null)}
                          className="p-0.5 text-black/40 hover:text-black"
                        >
                          <X className="size-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRevokeConfirm(src.id as SourceId)}
                        className="ml-1 p-0.5 text-black/30 hover:text-nb-coral transition-colors rounded"
                        title="Revoke access"
                      >
                        <Unplug className="size-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => reconnect(src.id as SourceId)}
                    className="flex items-center gap-1 text-[11px] font-black text-black bg-nb-green border-[2px] border-black rounded-lg px-2 py-1 shadow-nb-sm transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] shrink-0"
                  >
                    <PlugZap className="size-3" />
                    Connect
                  </button>
                )}
              </div>

              {isOpen && connected && (
                <div className="space-y-1.5 border-t-[2px] border-black bg-nb-cream px-3 py-2.5">
                  {events.map((ev) => {
                    const EvIcon = SOURCE_ICONS[ev.source as SourceId];
                    return (
                      <div key={ev.id} className="flex items-start gap-2">
                        <span className="mt-0.5 flex shrink-0 text-black/50">
                          <EvIcon className="size-3.5" />
                        </span>
                        <div>
                          <div className="text-[11px] font-bold text-black">{ev.title}</div>
                          <div className="text-[10px] font-semibold text-black/50">
                            {ev.date} · {ev.time} · {ev.duration}min
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => mockSync(src.id)}
                    className="mt-1 flex items-center gap-1 text-[11px] font-black text-black/40 transition-colors hover:text-nb-blue"
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
