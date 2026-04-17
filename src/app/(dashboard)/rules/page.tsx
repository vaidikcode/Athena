"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil, Trash2, Plus, ChevronUp, ChevronDown } from "lucide-react";
import type { Rule, Suggestion } from "@/lib/db";

function sourceVariant(source: string): "agent" | "user" {
  return source === "agent" ? "agent" : "user";
}

export default function RulesPage() {
  const qc = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);

  const { data: rules = [] } = useQuery<Rule[]>({
    queryKey: ["rules"],
    queryFn: () => fetch("/api/rules").then((r) => r.json()),
  });

  const { data: pendingSuggestions = [] } = useQuery<Suggestion[]>({
    queryKey: ["suggestions", "pending"],
    queryFn: () => fetch("/api/suggestions?status=pending").then((r) => r.json()),
  });

  const ruleProposals = pendingSuggestions.filter((s) => s.kind === "rule.add");

  async function acceptSuggestion(s: Suggestion) {
    await fetch(`/api/suggestions/${s.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    // also create the rule
    const payload = s.payload as { title?: string; body?: string; priority?: number; tags?: string[]; confidence?: number };
    await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, source: "agent" }),
    });
    qc.invalidateQueries({ queryKey: ["suggestions"] });
    qc.invalidateQueries({ queryKey: ["rules"] });
  }

  async function rejectSuggestion(id: string) {
    await fetch(`/api/suggestions/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    qc.invalidateQueries({ queryKey: ["suggestions"] });
  }

  async function toggleEnabled(rule: Rule) {
    await fetch(`/api/rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    qc.invalidateQueries({ queryKey: ["rules"] });
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this rule?")) return;
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["rules"] });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title="Rules" subtitle="Automations the assistant can follow or suggest" />
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>

        {/* Agent-proposed inbox */}
        {ruleProposals.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionHeader label="Agent Proposals" count={ruleProposals.length} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ruleProposals.map((s) => {
                const p = s.payload as { title?: string; body?: string; confidence?: number };
                return (
                  <div
                    key={s.id}
                    className="card"
                    style={{
                      padding: "14px 16px",
                      borderLeft: "2px solid var(--agent)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500, fontSize: 13, color: "var(--ink)" }}>
                          {p.title ?? "Untitled rule"}
                        </span>
                        <Badge variant="agent">agent proposed</Badge>
                        {p.confidence !== undefined && (
                          <span className="mono" style={{ color: "var(--ink-subtle)", fontSize: 11 }}>
                            {Math.round(p.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: 0, lineHeight: 1.5 }}>
                        {p.body}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => acceptSuggestion(s)}
                        style={{
                          background: "rgba(74,222,128,0.1)",
                          border: "1px solid rgba(74,222,128,0.2)",
                          borderRadius: 4,
                          padding: "5px 10px",
                          color: "var(--status-success)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 12,
                        }}
                      >
                        <Check size={12} /> Accept
                      </button>
                      <button
                        onClick={() => rejectSuggestion(s.id)}
                        style={{
                          background: "rgba(248,113,113,0.08)",
                          border: "1px solid rgba(248,113,113,0.15)",
                          borderRadius: 4,
                          padding: "5px 10px",
                          color: "var(--status-error)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 12,
                        }}
                      >
                        <X size={12} /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rules list header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <SectionHeader label="Active Rules" count={rules.length} />
          <Button variant="ghost" onClick={() => setShowNewForm((v) => !v)}>
            <Plus size={13} /> New Rule
          </Button>
        </div>

        {/* New rule form */}
        {showNewForm && (
          <NewRuleForm
            onSaved={() => {
              setShowNewForm(false);
              qc.invalidateQueries({ queryKey: ["rules"] });
            }}
            onCancel={() => setShowNewForm(false)}
          />
        )}

        {/* Rules list */}
        {rules.length === 0 ? (
          <EmptyState msg="No rules yet. Add one above or run the agent — it will propose rules based on your patterns." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rules.map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                onToggle={() => toggleEnabled(rule)}
                onDelete={() => deleteRule(rule.id)}
                onSave={(patch) =>
                  fetch(`/api/rules/${rule.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(patch),
                  }).then(() => qc.invalidateQueries({ queryKey: ["rules"] }))
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RuleRow({
  rule,
  onToggle,
  onDelete,
  onSave,
}: {
  rule: Rule;
  onToggle: () => void;
  onDelete: () => void;
  onSave: (patch: { title?: string; body?: string; priority?: number }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(rule.title);
  const [body, setBody] = useState(rule.body);

  async function save() {
    await onSave({ title, body });
    setEditing(false);
  }

  return (
    <div
      className="card"
      style={{
        padding: "14px 16px",
        opacity: rule.enabled ? 1 : 0.5,
        borderLeft: rule.enabled ? "2px solid var(--surface-border)" : "2px solid transparent",
      }}
    >
      {editing ? (
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical", marginTop: 6 }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button variant="default" onClick={save}>Save</Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          {/* Priority indicator */}
          <div
            className="mono"
            style={{
              color: "var(--ink-subtle)",
              fontSize: 11,
              minWidth: 24,
              paddingTop: 3,
              textAlign: "center",
            }}
          >
            P{rule.priority}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 500, fontSize: 13, color: "var(--ink)" }}>{rule.title}</span>
              <Badge variant={sourceVariant(rule.source)}>{rule.source}</Badge>
              {(rule.tags as string[]).map((tag) => (
                <Badge key={tag} variant="muted">{tag}</Badge>
              ))}
              {rule.confidence !== null && rule.confidence !== undefined && (
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-subtle)" }}>
                  {Math.round(rule.confidence * 100)}%
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: 0, lineHeight: 1.5 }}>
              {rule.body}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0, paddingTop: 2 }}>
            <IconBtn onClick={onToggle} title={rule.enabled ? "Disable" : "Enable"}>
              {rule.enabled ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </IconBtn>
            <IconBtn onClick={() => setEditing(true)} title="Edit">
              <Pencil size={13} />
            </IconBtn>
            <IconBtn onClick={onDelete} title="Delete" danger>
              <Trash2 size={13} />
            </IconBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function NewRuleForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState(5);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title || !body) return;
    setSaving(true);
    try {
      await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, priority, source: "user" }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ padding: "16px", marginBottom: 16, borderLeft: "2px solid var(--agent)" }}>
      <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 10 }}>New Rule</div>
      <input
        placeholder="Rule title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={inputStyle}
      />
      <textarea
        placeholder="Describe what this rule means and when it applies…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: "vertical", marginTop: 8 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <label style={{ fontSize: 12, color: "var(--ink-subtle)" }}>
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            style={{ ...inputStyle, display: "inline-block", marginLeft: 8, width: "auto", padding: "4px 8px" }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Button variant="default" onClick={save} disabled={saving || !title || !body}>
          {saving ? "Saving…" : "Save Rule"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        fontWeight: 600,
        color: "var(--ink-subtle)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 10,
      }}
    >
      {label}
      <span
        className="mono"
        style={{
          background: "var(--surface-overlay)",
          border: "1px solid var(--surface-border)",
          borderRadius: 10,
          padding: "1px 7px",
          fontSize: 10,
          color: "var(--ink-muted)",
        }}
      >
        {count}
      </span>
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

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "transparent",
        border: "1px solid var(--surface-border)",
        borderRadius: 4,
        padding: "4px 6px",
        cursor: "pointer",
        color: danger ? "var(--status-error)" : "var(--ink-subtle)",
        display: "flex",
        alignItems: "center",
      }}
    >
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface-overlay)",
  border: "1px solid var(--surface-border)",
  borderRadius: 5,
  padding: "8px 10px",
  color: "var(--ink)",
  fontSize: 13,
  outline: "none",
};
