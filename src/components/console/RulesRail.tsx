"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, ShieldCheck, ToggleLeft, ToggleRight, Pencil, Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Rule {
  id: string;
  title: string;
  body: string;
  priority: number;
  enabled: boolean;
  source: "user" | "agent";
  tags?: string[];
}

async function fetchRules(): Promise<Rule[]> {
  const res = await fetch("/api/rules");
  if (!res.ok) return [];
  return res.json();
}

function PriorityBar({ priority }: { priority: number }) {
  const segments = [1, 2, 3];
  const filled = priority >= 8 ? 3 : priority >= 5 ? 2 : 1;
  return (
    <span className="flex gap-0.5 shrink-0 items-center" title={`Priority ${priority}`}>
      {segments.map((s) => (
        <span
          key={s}
          className={cn("inline-block h-1.5 w-3 rounded-sm", s <= filled ? "bg-brand-600" : "bg-surface-border")}
        />
      ))}
    </span>
  );
}

interface RuleRowProps {
  rule: Rule;
  onToggle: (id: string, enabled: boolean) => void;
  onSave: (id: string, patch: { title: string; body: string }) => void;
}

function RuleRow({ rule, onToggle, onSave }: RuleRowProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(rule.title);
  const [body, setBody] = useState(rule.body);

  const save = () => { onSave(rule.id, { title, body }); setEditing(false); };
  const cancel = () => { setTitle(rule.title); setBody(rule.body); setEditing(false); };

  return (
    <div
      className={cn(
        "rounded-lg border p-2.5 transition-all",
        rule.enabled
          ? "border-surface-border bg-white hover:border-brand-200"
          : "border-surface-border/50 bg-surface-base opacity-50"
      )}
    >
      {editing ? (
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-surface-border bg-surface-base px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-600/30"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[52px] resize-y text-xs"
          />
          <div className="flex gap-1">
            <Button size="sm" className="h-6 rounded-md px-2 text-[11px]" onClick={save}>
              <Check className="size-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 rounded-md px-2 text-[11px]" onClick={cancel}>
              <X className="size-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <PriorityBar priority={rule.priority} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-ink leading-tight truncate">{rule.title}</p>
            <p className="text-[11px] text-ink-subtle leading-snug mt-0.5 line-clamp-2">{rule.body}</p>
            {rule.source === "agent" && (
              <span className="mt-1 inline-block text-[10px] font-medium text-brand-600 bg-brand-50 rounded px-1">
                AI
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" className="text-ink-faint hover:text-ink p-0.5 rounded" onClick={() => setEditing(true)}>
              <Pencil className="size-3" />
            </button>
            <button
              type="button"
              className={cn("p-0.5 rounded transition-colors", rule.enabled ? "text-brand-600" : "text-ink-faint hover:text-ink")}
              onClick={() => onToggle(rule.id, !rule.enabled)}
            >
              {rule.enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RulesRail() {
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["rules"],
    queryFn: fetchRules,
    staleTime: 30_000,
  });

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  const toggle = async (id: string, enabled: boolean) => {
    await fetch(`/api/rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    void queryClient.invalidateQueries({ queryKey: ["rules"] });
  };

  const save = async (id: string, patch: { title: string; body: string }) => {
    await fetch(`/api/rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    void queryClient.invalidateQueries({ queryKey: ["rules"] });
  };

  const addRule = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), body: newBody.trim(), source: "user" }),
    });
    setNewTitle(""); setNewBody(""); setAdding(false);
    void queryClient.invalidateQueries({ queryKey: ["rules"] });
  };

  const enabled = rules.filter((r) => r.enabled);
  const disabled = rules.filter((r) => !r.enabled);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-brand-600 shrink-0" />
          <span className="text-xs font-semibold text-ink">Rules</span>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="rounded-md p-1 text-ink-faint hover:text-brand-600 hover:bg-brand-50 transition-colors"
          title="Add rule"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {isLoading && <p className="text-xs text-ink-faint px-1 py-2">Loading…</p>}

        {adding && (
          <div className="rounded-lg border-2 border-dashed border-brand-200 bg-brand-50/50 p-2.5 space-y-2">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Rule title…"
              className="w-full rounded-md border border-surface-border bg-white px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-600/30"
            />
            <Textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Describe the rule…"
              className="min-h-[48px] resize-y text-xs"
            />
            <div className="flex gap-1.5">
              <Button size="sm" className="h-6 rounded-md px-2.5 text-[11px]" onClick={() => void addRule()}>
                Add
              </Button>
              <Button size="sm" variant="ghost" className="h-6 rounded-md px-2.5 text-[11px]" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {enabled.length === 0 && !isLoading && !adding && (
          <p className="text-xs text-ink-faint px-1 py-3 leading-relaxed">
            No active rules. Add one or ask the agent to propose one.
          </p>
        )}

        <div className="space-y-1.5">
          {enabled.map((r) => (
            <div key={r.id} className="group">
              <RuleRow rule={r} onToggle={(id, en) => void toggle(id, en)} onSave={(id, p) => void save(id, p)} />
            </div>
          ))}
        </div>

        {disabled.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider px-1 pt-3">Disabled</p>
            <div className="space-y-1.5">
              {disabled.map((r) => (
                <div key={r.id} className="group">
                  <RuleRow rule={r} onToggle={(id, en) => void toggle(id, en)} onSave={(id, p) => void save(id, p)} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="px-3.5 py-2 border-t border-surface-border bg-surface-base/50">
        <p className="text-[10px] text-ink-faint">
          {enabled.length} active · {rules.length} total
        </p>
      </div>
    </div>
  );
}
