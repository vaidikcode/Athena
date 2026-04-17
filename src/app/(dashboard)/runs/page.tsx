"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/Badge";
import { JsonCollapse } from "@/components/ui/JsonCollapse";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Run } from "@/lib/db";

function fmt(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function statusVariant(status: string): "success" | "error" | "running" | "muted" {
  if (status === "success") return "success";
  if (status === "error") return "error";
  if (status === "running") return "running";
  return "muted";
}

export default function RunsPage() {
  const [kindFilter, setKindFilter] = useState<"all" | "hourly" | "daily">("all");

  const { data: runs = [], isLoading } = useQuery<Run[]>({
    queryKey: ["runs", kindFilter],
    queryFn: () =>
      fetch(
        kindFilter === "all"
          ? "/api/runs?limit=50"
          : `/api/runs?kind=${kindFilter}&limit=50`
      ).then((r) => r.json()),
    refetchInterval: 5000,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title="Runs" />
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {/* Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["all", "hourly", "daily"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              style={{
                padding: "5px 12px",
                borderRadius: 4,
                border: "1px solid var(--surface-border)",
                background: kindFilter === k ? "var(--surface-overlay)" : "transparent",
                color: kindFilter === k ? "var(--ink)" : "var(--ink-subtle)",
                cursor: "pointer",
                fontSize: 12,
                textTransform: "capitalize",
              }}
            >
              {k}
            </button>
          ))}
        </div>

        {isLoading && (
          <div style={{ color: "var(--ink-subtle)", fontSize: 13 }}>Loading…</div>
        )}

        {!isLoading && runs.length === 0 && (
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
            No runs yet. Use "Run Hourly Now" on the Dashboard to trigger the agent.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {runs.map((run) => (
            <RunRow key={run.id} run={run} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RunRow({ run }: { run: Run }) {
  const [open, setOpen] = useState(false);

  const dur =
    run.finishedAt && run.startedAt
      ? Math.round(
          (new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000
        )
      : null;

  const toolCalls = (run.toolCalls ?? []) as Array<{ name: string; args: unknown; id?: string }>;
  const transcript = (run.transcript ?? []) as Array<{ type: string; content: unknown }>;

  return (
    <div
      className="card"
      style={{ overflow: "hidden" }}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "13px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          textAlign: "left",
        }}
      >
        <span style={{ color: "var(--ink-subtle)", flexShrink: 0 }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>

        <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
        <Badge variant="muted">{run.kind}</Badge>

        <span className="mono" style={{ color: "var(--ink-muted)", fontSize: 12, flex: 1 }}>
          {fmt(run.startedAt)}
        </span>

        {dur !== null && (
          <span className="mono" style={{ color: "var(--ink-faint)", fontSize: 11 }}>
            {dur}s
          </span>
        )}

        {toolCalls.length > 0 && (
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--agent)",
              background: "rgba(56,189,248,0.08)",
              border: "1px solid rgba(56,189,248,0.15)",
              borderRadius: 3,
              padding: "1px 6px",
            }}
          >
            {toolCalls.length} tool calls
          </span>
        )}

        <span className="mono" style={{ fontSize: 10, color: "var(--ink-faint)" }}>
          {run.id.slice(0, 8)}
        </span>
      </button>

      {/* Expanded content */}
      {open && (
        <div
          style={{
            borderTop: "1px solid var(--surface-border)",
            padding: "14px 16px",
            background: "var(--surface-base)",
          }}
        >
          {run.error && (
            <div
              className="mono"
              style={{
                color: "var(--status-error)",
                fontSize: 11,
                background: "rgba(248,113,113,0.06)",
                border: "1px solid rgba(248,113,113,0.15)",
                borderRadius: 4,
                padding: "8px 12px",
                marginBottom: 12,
              }}
            >
              Error: {run.error}
            </div>
          )}

          {/* Tool calls */}
          {toolCalls.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-subtle)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 8,
                }}
              >
                Tool Calls
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {toolCalls.map((tc, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "6px 10px",
                      background: "var(--surface-overlay)",
                      borderRadius: 4,
                      border: "1px solid var(--surface-border)",
                    }}
                  >
                    <span
                      className="mono"
                      style={{ color: "var(--agent)", fontSize: 12, minWidth: 180 }}
                    >
                      {tc.name}
                    </span>
                    <JsonCollapse data={tc.args} label="args" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript */}
          {transcript.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-subtle)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 8,
                }}
              >
                Transcript
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {transcript.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 12px",
                      background: "var(--surface-overlay)",
                      borderRadius: 4,
                      border: "1px solid var(--surface-border)",
                    }}
                  >
                    <div
                      className="mono"
                      style={{
                        fontSize: 10,
                        color: "var(--ink-faint)",
                        marginBottom: 4,
                        textTransform: "uppercase",
                      }}
                    >
                      {msg.type}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.5 }}>
                      {typeof msg.content === "string"
                        ? msg.content
                        : JSON.stringify(msg.content)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
