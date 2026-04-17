"use client";

import { useState, useEffect } from "react";
import type { CalEvent } from "./types";

interface Props {
  event?: CalEvent | null;
  defaultDate?: Date;
  onSave: (data: Partial<CalEvent>) => void;
  onClose: () => void;
}

const EVENT_TYPES = ["deep_work", "meeting", "admin", "personal", "health", "learning", "social", "other"] as const;
const ENERGY_COSTS = ["low", "medium", "high"] as const;

function toLocalDatetimeString(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStartEnd(date: Date): { startAt: string; endAt: string } {
  const s = new Date(date);
  s.setMinutes(0, 0, 0);
  const e = new Date(s);
  e.setHours(e.getHours() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { startAt: fmt(s), endAt: fmt(e) };
}

export function EventDialog({ event, defaultDate, onSave, onClose }: Props) {
  const defaults = defaultStartEnd(defaultDate ?? new Date());

  const [form, setForm] = useState({
    title: event?.title ?? "",
    description: event?.description ?? "",
    location: event?.location ?? "",
    startAt: event ? toLocalDatetimeString(event.startAt) : defaults.startAt,
    endAt: event ? toLocalDatetimeString(event.endAt) : defaults.endAt,
    allDay: event?.allDay ?? false,
    type: event?.type ?? "other" as CalEvent["type"],
    energyCost: event?.energyCost ?? "medium" as CalEvent["energyCost"],
    priority: event?.priority ?? 5,
    tags: event?.tags?.join(", ") ?? "",
    color: event?.color ?? "",
    justification: event?.justification ?? "",
    attendees: event?.attendees?.join(", ") ?? "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        title: form.title,
        description: form.description || undefined,
        location: form.location || undefined,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        allDay: form.allDay,
        type: form.type,
        energyCost: form.energyCost,
        priority: form.priority,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        color: form.color || undefined,
        justification: form.justification || undefined,
        attendees: form.attendees ? form.attendees.split(",").map((a) => a.trim()).filter(Boolean) : [],
      });
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof typeof form, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--surface-border)",
        borderRadius: 8,
        width: "100%",
        maxWidth: 540,
        maxHeight: "90vh",
        overflow: "auto",
        padding: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
            {event ? "Edit Event" : "New Event"}
            {event?.source === "agent" && (
              <span style={{ marginLeft: 8, fontSize: 11, color: "var(--agent)", fontWeight: 400 }}>✦ agent-created</span>
            )}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-subtle)", fontSize: 18 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Title */}
          <label style={labelStyle}>
            Title *
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              style={inputStyle}
              placeholder="Event title"
            />
          </label>

          {/* Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>
              Start
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => set("startAt", e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              End
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => set("endAt", e.target.value)}
                style={inputStyle}
              />
            </label>
          </div>

          {/* Type + Energy */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>
              Type
              <select value={form.type} onChange={(e) => set("type", e.target.value)} style={inputStyle}>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
            </label>
            <label style={labelStyle}>
              Energy Cost
              <select value={form.energyCost} onChange={(e) => set("energyCost", e.target.value)} style={inputStyle}>
                {ENERGY_COSTS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Priority */}
          <label style={labelStyle}>
            Priority ({form.priority})
            <input
              type="range"
              min={1}
              max={10}
              value={form.priority}
              onChange={(e) => set("priority", Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--agent)" }}
            />
          </label>

          {/* Description */}
          <label style={labelStyle}>
            Description
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
              placeholder="What is this event about?"
            />
          </label>

          {/* Location */}
          <label style={labelStyle}>
            Location
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              style={inputStyle}
              placeholder="Physical or virtual location"
            />
          </label>

          {/* Attendees */}
          <label style={labelStyle}>
            Attendees (comma-separated)
            <input
              value={form.attendees}
              onChange={(e) => set("attendees", e.target.value)}
              style={inputStyle}
              placeholder="alice@example.com, bob@example.com"
            />
          </label>

          {/* Tags */}
          <label style={labelStyle}>
            Tags (comma-separated)
            <input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              style={inputStyle}
              placeholder="focus, client, health"
            />
          </label>

          {/* Justification */}
          <label style={labelStyle}>
            Justification / why this event exists
            <input
              value={form.justification}
              onChange={(e) => set("justification", e.target.value)}
              style={inputStyle}
              placeholder="Optional — helps the agent understand purpose"
            />
          </label>

          {/* Agent read-only badge */}
          {event?.linkedRuleId && (
            <div style={{ fontSize: 11, color: "var(--ink-subtle)", padding: "6px 10px", border: "1px solid var(--surface-border)", borderRadius: 4 }}>
              Linked rule: <code style={{ color: "var(--agent)" }}>{event.linkedRuleId}</code>
            </div>
          )}

          {/* All day */}
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-subtle)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => set("allDay", e.target.checked)}
              style={{ accentColor: "var(--agent)" }}
            />
            All day
          </label>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={saving} style={saveBtnStyle}>
              {saving ? "Saving…" : event ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 12,
  color: "var(--ink-subtle)",
};

const inputStyle: React.CSSProperties = {
  background: "var(--surface-overlay)",
  border: "1px solid var(--surface-border)",
  borderRadius: 4,
  padding: "7px 10px",
  fontSize: 13,
  color: "var(--ink)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: 13,
  background: "transparent",
  border: "1px solid var(--surface-border)",
  borderRadius: 4,
  cursor: "pointer",
  color: "var(--ink-subtle)",
};

const saveBtnStyle: React.CSSProperties = {
  padding: "8px 20px",
  fontSize: 13,
  background: "var(--agent)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  color: "#fff",
  fontWeight: 500,
};
