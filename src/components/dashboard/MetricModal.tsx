"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  metric: string;
  value: number;
  max: number;
  onClose: () => void;
};

function humanLabel(metric: string) {
  const map: Record<string, string> = {
    health: "Health",
    knowledge: "Knowledge",
    money: "Money",
    work: "Work",
    energy: "Energy",
    attention: "Attention Score",
  };
  if (metric.startsWith("relationship-")) return metric.replace("relationship-", "Relationship: ");
  return map[metric] ?? metric.charAt(0).toUpperCase() + metric.slice(1);
}

export function MetricModal({ metric, value, max, onClose }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    async function load() {
      try {
        const res = await fetch("/api/dashboard/metric-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metric, value, max }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error("No stream");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        setLoading(false);

        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          setText((prev) => prev + decoder.decode(chunk, { stream: true }));
        }
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        setError((e as Error)?.message ?? "Failed to load suggestions");
        setLoading(false);
      }
    }

    void load();
    return () => ctrl.abort();
  }, [metric, value, max]);

  const pct = Math.round((value / max) * 100);
  const isLow = pct < 50;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-athens-blue/25 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-athens-stone bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-athens-stone px-6 py-5">
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-xl border border-athens-stone",
              isLow ? "bg-athens-highlight" : "bg-athens-highlight"
            )}
          >
            <Sparkles className={cn("size-4", isLow ? "text-athens-blue/55" : "text-athens-blue")} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-athens-blue">{humanLabel(metric)}</div>
            <div className="text-xs font-light text-athens-blue/65">
              {value}/{max} · {pct}% · {isLow ? "Below target — " : "On track — "}suggestions
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-athens-blue/50 hover:bg-athens-highlight hover:text-athens-blue"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 pb-2 pt-4">
          <div className="h-1.5 w-full rounded-full bg-athens-stone">
            <div
              className={cn("h-full rounded-full bg-athens-blue transition-all", isLow && "opacity-50")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="max-h-[420px] min-h-[200px] overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm font-light text-athens-blue/70">
              <Loader2 className="size-4 animate-spin text-athens-blue" />
              Analysing your data…
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-athens-stone bg-athens-highlight px-3 py-2 text-sm text-athens-blue">
              {error}
            </div>
          )}
          {text && <div className="whitespace-pre-wrap text-sm font-light leading-relaxed text-athens-blue">{text}</div>}
        </div>

        <div className="flex justify-end border-t border-athens-stone px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-athens-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-athens-blue/90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
