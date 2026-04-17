"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Play, Clock, Calendar, Zap, AlertCircle } from "lucide-react";
import type { Run, Memory, Suggestion } from "@/lib/db";

function fmt(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function nextCronEta(type: "hourly" | "daily") {
  const now = new Date();
  if (type === "hourly") {
    const next = new Date(now);
    next.setMinutes(0, 0, 0);
    next.setHours(next.getHours() + 1);
    const diffMs = next.getTime() - now.getTime();
    const mins = Math.floor(diffMs / 60000);
    return `${mins}m`;
  } else {
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 5, 0, 0);
    const diffMs = next.getTime() - now.getTime();
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  }
}

function runStatusVariant(status: string): "success" | "error" | "running" | "muted" {
  if (status === "success") return "success";
  if (status === "error") return "error";
  if (status === "running") return "running";
  return "muted";
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const [hourlyLoading, setHourlyLoading] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);

  const { data: runs = [] } = useQuery<Run[]>({
    queryKey: ["runs"],
    queryFn: () => fetch("/api/runs?limit=20").then((r) => r.json()),
  });

  const { data: hourlyMemories = [] } = useQuery<Memory[]>({
    queryKey: ["memory", "hourly"],
    queryFn: () => fetch("/api/memory/hourly").then((r) => r.json()),
  });

  const { data: suggestions = [] } = useQuery<Suggestion[]>({
    queryKey: ["suggestions", "pending"],
    queryFn: () => fetch("/api/suggestions?status=pending").then((r) => r.json()),
  });

  const lastRun = runs[0];
  const pendingCount = suggestions.length;

  async function trigger(kind: "hourly" | "daily") {
    if (kind === "hourly") setHourlyLoading(true);
    else setDailyLoading(true);
    try {
      await fetch(`/api/runs/${kind}`, { method: "POST" });
      await qc.invalidateQueries({ queryKey: ["runs"] });
      await qc.invalidateQueries({ queryKey: ["memory"] });
      await qc.invalidateQueries({ queryKey: ["suggestions"] });
    } finally {
      if (kind === "hourly") setHourlyLoading(false);
      else setDailyLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title="Dashboard" />

      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {/* Stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          <StatCard
            icon={<Zap size={14} />}
            label="Next Hourly"
            value={nextCronEta("hourly")}
            sub="until auto-run"
          />
          <StatCard
            icon={<Calendar size={14} />}
            label="Next Daily"
            value={nextCronEta("daily")}
            sub="until auto-run"
          />
          <StatCard
            icon={<AlertCircle size={14} />}
            label="Pending Suggestions"
            value={String(pendingCount)}
            sub="awaiting review"
            accent={pendingCount > 0}
          />
          <StatCard
            icon={<Clock size={14} />}
            label="Last Run"
            value={lastRun ? fmt(lastRun.startedAt) : "never"}
            sub={lastRun ? fmtDate(lastRun.startedAt) : "—"}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <Button
            variant="primary"
            onClick={() => trigger("hourly")}
            disabled={hourlyLoading}
          >
            <Play size={13} />
            {hourlyLoading ? "Running hourly…" : "Run Hourly Now"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => trigger("daily")}
            disabled={dailyLoading}
          >
            <Play size={13} />
            {dailyLoading ? "Running daily…" : "Run Daily Now"}
          </Button>
        </div>

        {/* Today's timeline */}
        <Section title="Today's Hourly Timeline">
          {hourlyMemories.length === 0 ? (
            <EmptyState msg="No hourly memories yet. Run the agent to generate them." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {hourlyMemories.map((m) => (
                <HourlyChip key={m.id} memory={m} />
              ))}
            </div>
          )}
        </Section>

        {/* Last run card */}
        {lastRun && (
          <Section title="Last Run" style={{ marginTop: 24 }}>
            <RunCard run={lastRun} />
          </Section>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: accent ? "var(--status-warning)" : "var(--ink-subtle)",
          fontSize: 12,
          marginBottom: 8,
        }}
      >
        {icon} {label}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: accent ? "var(--status-warning)" : "var(--ink)",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-subtle)", marginTop: 3 }}>
        {sub}
      </div>
    </div>
  );
}

function HourlyChip({ memory }: { memory: Memory }) {
  return (
    <div
      className="card"
      style={{ padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 14 }}
    >
      <span
        className="mono"
        style={{ color: "var(--ink-subtle)", fontSize: 12, minWidth: 44, paddingTop: 2 }}
      >
        {fmt(memory.windowStart)}
      </span>
      <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>
        {memory.summary}
      </span>
    </div>
  );
}

function RunCard({ run }: { run: Run }) {
  const dur =
    run.finishedAt && run.startedAt
      ? Math.round(
          (new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000
        )
      : null;

  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Badge variant={runStatusVariant(run.status)}>{run.status}</Badge>
        <Badge variant="muted">{run.kind}</Badge>
        <span className="mono" style={{ color: "var(--ink-subtle)", fontSize: 12 }}>
          {fmtDate(run.startedAt)} {fmt(run.startedAt)}
        </span>
        {dur !== null && (
          <span className="mono" style={{ color: "var(--ink-faint)", fontSize: 11 }}>
            {dur}s
          </span>
        )}
      </div>
      {run.error && (
        <div
          className="mono"
          style={{
            color: "var(--status-error)",
            fontSize: 11,
            background: "rgba(248,113,113,0.06)",
            border: "1px solid rgba(248,113,113,0.15)",
            borderRadius: 4,
            padding: "6px 10px",
          }}
        >
          {run.error}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--ink-subtle)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
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
