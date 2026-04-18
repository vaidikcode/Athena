"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, AlertCircle } from "lucide-react";

interface Props {
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
  addToolResult: (toolCallId: string, result: unknown) => void;
  label?: string;
}

export function ConfirmBar({ toolCallId, toolName, input, addToolResult, label }: Props) {
  const [decided, setDecided] = useState<"confirmed" | "rejected" | null>(null);

  const confirm = () => {
    addToolResult(toolCallId, { approved: true, ...input });
    setDecided("confirmed");
  };

  const reject = () => {
    addToolResult(toolCallId, { approved: false, reason: "User rejected" });
    setDecided("rejected");
  };

  if (decided === "confirmed") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-nb-blue/30 bg-nb-blue/10 px-3 py-2.5">
        <Check className="size-4 text-nb-blue shrink-0" />
        <p className="text-xs text-nb-blue font-medium">Confirmed — applying {toolName.replace(/_/g, " ")}…</p>
      </div>
    );
  }

  if (decided === "rejected") {
    return (
      <div className="flex items-center gap-2 rounded-xl border-[2px] border-black bg-nb-cream px-3 py-2.5">
        <X className="size-4 text-ink-faint shrink-0" />
        <p className="text-xs text-ink-subtle">Action rejected.</p>
      </div>
    );
  }

  const title = label ?? `Confirm: ${toolName.replace(/_/g, " ")}`;

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-amber-200 bg-amber-50">
        <AlertCircle className="size-4 text-amber-600 shrink-0" />
        <p className="text-xs font-bold text-amber-800">{title}</p>
      </div>
      <div className="p-3.5">
        <pre className="text-[11px] text-ink-subtle bg-nb-cream rounded-lg border-[2px] border-black px-2.5 py-2 overflow-auto max-h-28 font-mono whitespace-pre-wrap">
          {JSON.stringify(input, null, 2)}
        </pre>
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="rounded-lg" onClick={confirm}>
            <Check className="size-3" />
            Confirm
          </Button>
          <Button size="sm" variant="ghost" className="rounded-lg text-ink-faint" onClick={reject}>
            <X className="size-3" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
