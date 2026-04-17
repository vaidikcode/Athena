"use client";

import { useEffect, useState } from "react";
import type { CalEvent, CalEventLog } from "./types";
import { TYPE_COLORS, ENERGY_DOT } from "./types";

interface Props {
  event: CalEvent;
  onClose: () => void;
  onEdit: (e: CalEvent) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

function LogEntry({ log }: { log: CalEventLog }) {
  const atStr = new Date(log.at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const actionColor: Record<string, string> = {
    created: "#52b788",
    updated: "#f4d35e",
    completed: "#52b788",
    cancelled: "#e63946",
    rescheduled: "#f4a261",
    annotated: "#7ec8e3",
  };

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid var(--surface-border)" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: actionColor[log.action] ?? "#888", flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: actionColor[log.action] ?? "#888", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {log.action}
          </span>
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-faint)" }}>{atStr}</span>
          <span style={{ fontSize: 10, color: "var(--ink-faint)", marginLeft: "auto" }}>by {log.actor}</span>
        </div>
        {log.note && <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginTop: 3 }}>{log.note}</div>}
        {log.diff && Object.keys(log.diff).length > 0 && (
          <details style={{ marginTop: 4 }}>
            <summary style={{ fontSize: 10, color: "var(--ink-faint)", cursor: "pointer" }}>diff</summary>
            <pre style={{ fontSize: 10, color: "var(--ink-subtle)", background: "var(--surface-overlay)", padding: "4px 8px", borderRadius: 3, margin: "4px 0 0", overflow: "auto" }}>
              {JSON.stringify(log.diff, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export function EventInspector({ event, onClose, onEdit, onDelete, onComplete }: Props) {
  const [logs, setLogs] = useState<CalEventLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoadingLogs(true);
    const id = event.recurrenceParentId ?? event.id;
    fetch(`/api/calendar/events/${id}/logs`)
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoadingLogs(false));
  }, [event.id, event.recurrenceParentId]);

  const colors = TYPE_COLORS[event.type] ?? TYPE_COLORS.other;

  const startStr = new Date(event.startAt).toLocaleString([], {
    weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const endStr = new Date(event.endAt).toLocaleString([], { hour: "2-digit", minute: "2-digit" });
  const durationMin = Math.round((new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / 60000);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await fetch(`/api/calendar/events/${event.id}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      onComplete(event.id);
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${event.title}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/calendar/events/${event.id}`, { method: "DELETE" });
      onDelete(event.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{
      width: 360,
      flexShrink: 0,
      borderLeft: "1px solid var(--surface-border)",
      background: "var(--surface-raised)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `3px solid ${colors.border}`,
        padding: "16px 16px 12px",
        background: colors.bg,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {event.source === "agent" && <span style={{ marginRight: 6, fontSize: 11 }}>✦</span>}
              {event.title}
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 4 }}>
              {event.type.replace("_", " ")} · pri {event.priority}
              {" · "}
              <span style={{ color: ENERGY_DOT[event.energyCost] }}>●</span>
              {" "}{event.energyCost} energy
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-subtle)", fontSize: 18, flexShrink: 0, lineHeight: 1, padding: 0 }}>×</button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Time */}
        <section>
          <SectionLabel>Time</SectionLabel>
          <div className="mono" style={{ fontSize: 12, color: "var(--ink)" }}>
            {startStr} – {endStr}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-subtle)", marginTop: 2 }}>
            {durationMin} min{event.completedAt ? " · ✓ completed" : ""}
          </div>
        </section>

        {/* Plan vs Actual */}
        {(event.actualStartAt || event.actualEndAt) && (
          <section>
            <SectionLabel>Plan vs Actual</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--ink-faint)" }}>Planned</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-subtle)" }}>
                  {new Date(event.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(event.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--ink-faint)" }}>Actual</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink)" }}>
                  {event.actualStartAt ? new Date(event.actualStartAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  {" – "}
                  {event.actualEndAt ? new Date(event.actualEndAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Description */}
        {event.description && (
          <section>
            <SectionLabel>Description</SectionLabel>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-subtle)", lineHeight: 1.6 }}>{event.description}</p>
          </section>
        )}

        {/* Location */}
        {event.location && (
          <section>
            <SectionLabel>Location</SectionLabel>
            <div style={{ fontSize: 12, color: "var(--ink-subtle)" }}>{event.location}</div>
          </section>
        )}

        {/* Attendees */}
        {event.attendees && event.attendees.length > 0 && (
          <section>
            <SectionLabel>Attendees</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {event.attendees.map((a) => (
                <span key={a} style={{ fontSize: 11, padding: "2px 8px", background: "var(--surface-overlay)", borderRadius: 10, color: "var(--ink-subtle)", border: "1px solid var(--surface-border)" }}>
                  {a}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <section>
            <SectionLabel>Tags</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {event.tags.map((t) => (
                <span key={t} style={{ fontSize: 11, padding: "2px 8px", background: colors.bg, borderRadius: 10, color: colors.text, border: `1px solid ${colors.border}` }}>
                  #{t}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Justification */}
        {event.justification && (
          <section>
            <SectionLabel>Justification</SectionLabel>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-subtle)", lineHeight: 1.5, fontStyle: "italic" }}>{event.justification}</p>
          </section>
        )}

        {/* Outcome notes */}
        {event.outcomeNotes && (
          <section>
            <SectionLabel>Outcome Notes</SectionLabel>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-subtle)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{event.outcomeNotes}</p>
          </section>
        )}

        {/* Event log */}
        <section>
          <SectionLabel>Event Log</SectionLabel>
          {loadingLogs ? (
            <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>Loading…</div>
          ) : logs.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>No history yet</div>
          ) : (
            <div>
              {logs.map((log) => <LogEntry key={log.id} log={log} />)}
            </div>
          )}
        </section>
      </div>

      {/* Actions */}
      <div style={{
        borderTop: "1px solid var(--surface-border)",
        padding: "12px 16px",
        display: "flex",
        gap: 8,
        flexShrink: 0,
      }}>
        <button
          onClick={() => onEdit(event)}
          style={{ flex: 1, padding: "7px 0", fontSize: 12, background: "transparent", border: "1px solid var(--surface-border)", borderRadius: 4, cursor: "pointer", color: "var(--ink-subtle)" }}
        >
          Edit
        </button>
        {!event.completedAt && (
          <button
            onClick={handleComplete}
            disabled={completing}
            style={{ flex: 1, padding: "7px 0", fontSize: 12, background: "var(--surface-overlay)", border: "1px solid #52b788", borderRadius: 4, cursor: "pointer", color: "#52b788" }}
          >
            {completing ? "…" : "Complete"}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ padding: "7px 14px", fontSize: 12, background: "transparent", border: "1px solid #e63946", borderRadius: 4, cursor: "pointer", color: "#e63946" }}
        >
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mono" style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>
      {children}
    </div>
  );
}
