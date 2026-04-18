"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Shield } from "lucide-react";

interface RuleData {
  title: string;
  body: string;
  priority?: number;
  tags?: string[];
}

interface Props {
  toolCallId: string;
  rule: RuleData;
  /** Pre-bound to this tool's name; call as (toolCallId, output) */
  addToolResult: (toolCallId: string, result: unknown) => void;
}

export function RuleProposal({ toolCallId, rule, addToolResult }: Props) {
  const [title, setTitle] = useState(rule.title);
  const [body, setBody] = useState(rule.body);
  const [priority, setPriority] = useState(rule.priority ?? 5);
  const [applied, setApplied] = useState<"accepted" | "dismissed" | null>(null);

  const accept = () => {
    addToolResult(toolCallId, { approved: true, title, body, priority, tags: rule.tags ?? [] });
    setApplied("accepted");
  };

  const dismiss = () => {
    addToolResult(toolCallId, { approved: false });
    setApplied("dismissed");
  };

  if (applied === "accepted") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-nb-blue/30 bg-nb-blue/10 px-3 py-2.5">
        <Check className="size-4 text-nb-blue shrink-0" />
        <p className="text-xs text-nb-blue font-medium">Rule "{title}" accepted and being created…</p>
      </div>
    );
  }

  if (applied === "dismissed") {
    return (
      <div className="flex items-center gap-2 rounded-xl border-[2px] border-black bg-nb-cream px-3 py-2.5">
        <X className="size-4 text-ink-faint shrink-0" />
        <p className="text-xs text-ink-subtle">Rule proposal dismissed.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-nb-blue/30 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-nb-blue/30 bg-nb-blue/10">
        <Shield className="size-4 text-nb-blue shrink-0" />
        <p className="text-xs font-bold text-nb-blue">Proposed rule — review before saving</p>
      </div>
      <div className="p-3.5 space-y-3">
        <div>
          <label className="text-[11px] font-medium text-ink-subtle mb-1 block">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border-[2px] border-black bg-nb-cream px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-nb-blue/30"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-ink-subtle mb-1 block">Rule body</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[72px] resize-y"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-medium text-ink-subtle">Priority</label>
          <input
            type="range"
            min={1}
            max={10}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="flex-1 accent-brand-600"
          />
          <span className="text-xs font-bold text-nb-blue w-4">{priority}</span>
        </div>
        {rule.tags && rule.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {rule.tags.map((t) => (
              <span key={t} className="text-[11px] rounded-full px-2 py-0.5 border border-nb-blue/30 bg-nb-blue/10 text-nb-blue">
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <Button className="rounded-lg" size="sm" onClick={accept}>
            <Check className="size-3" />
            Accept rule
          </Button>
          <Button variant="ghost" className="rounded-lg" size="sm" onClick={dismiss}>
            <X className="size-3" />
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
