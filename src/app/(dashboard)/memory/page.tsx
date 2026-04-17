"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { JsonCollapse } from "@/components/ui/JsonCollapse";
import type { Memory } from "@/lib/db";

type Tab = "hourly" | "daily" | "yesterday";

function fmt(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function fmtFull(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function MemoryPage() {
  const [tab, setTab] = useState<Tab>("hourly");

  const { data: hourlyList = [] } = useQuery<Memory[]>({
    queryKey: ["memory", "hourly"],
    queryFn: () => fetch("/api/memory/hourly").then((r) => r.json()),
    enabled: tab === "hourly",
  });

  const { data: dailyMemory } = useQuery<Memory | null>({
    queryKey: ["memory", "daily"],
    queryFn: () => fetch("/api/memory/daily").then((r) => r.json()),
    enabled: tab === "daily",
  });

  const { data: yesterdayMemory } = useQuery<Memory | null>({
    queryKey: ["memory", "yesterday"],
    queryFn: () => fetch("/api/memory/yesterday").then((r) => r.json()),
    enabled: tab === "yesterday",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title="Memory" />

      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: 2,
            marginBottom: 20,
            background: "var(--surface-raised)",
            border: "1px solid var(--surface-border)",
            borderRadius: 6,
            padding: 4,
            width: "fit-content",
          }}
        >
          {(["hourly", "daily", "yesterday"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "6px 14px",
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: tab === t ? 500 : 400,
                background: tab === t ? "var(--surface-overlay)" : "transparent",
                color: tab === t ? "var(--ink)" : "var(--ink-subtle)",
                transition: "all 0.1s",
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Hourly tab */}
        {tab === "hourly" && (
          <div>
            {hourlyList.length === 0 ? (
              <EmptyState msg="No hourly memories for today. Run the hourly agent to populate this." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {hourlyList.map((m) => (
                  <MemoryCard key={m.id} memory={m} timeLabel={fmt(m.windowStart)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Daily tab */}
        {tab === "daily" && (
          <div>
            {!dailyMemory ? (
              <EmptyState msg="No daily memory for today yet. Run the daily agent after midnight." />
            ) : (
              <MemoryCard memory={dailyMemory} timeLabel={fmtFull(dailyMemory.windowStart)} />
            )}
          </div>
        )}

        {/* Yesterday tab */}
        {tab === "yesterday" && (
          <div>
            {!yesterdayMemory ? (
              <EmptyState msg="No daily memory for yesterday yet." />
            ) : (
              <MemoryCard memory={yesterdayMemory} timeLabel={fmtFull(yesterdayMemory.windowStart)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MemoryCard({ memory, timeLabel }: { memory: Memory; timeLabel: string }) {
  return (
    <div
      className="card"
      style={{ padding: "16px 18px" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
          paddingBottom: 10,
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <span className="mono" style={{ color: "var(--ink-subtle)", fontSize: 12 }}>
          {timeLabel}
        </span>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-faint)" }}>
          {memory.scope}
        </span>
        {memory.runId && (
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-faint)" }}>
            run: {memory.runId.slice(0, 8)}…
          </span>
        )}
      </div>

      {/* Summary */}
      <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6, margin: 0, marginBottom: 8 }}>
        {memory.summary}
      </p>

      {/* Collapsible raw events */}
      <JsonCollapse data={memory.events} label={`${(memory.events as unknown[]).length} events`} />
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div
      style={{
        padding: "28px 20px",
        textAlign: "center",
        color: "var(--ink-subtle)",
        fontSize: 13,
        border: "1px dashed var(--surface-border)",
        borderRadius: 6,
      }}
    >
      {msg}
    </div>
  );
}
