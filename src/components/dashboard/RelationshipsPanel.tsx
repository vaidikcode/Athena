"use client";

import { MOCK_RELATIONSHIPS, type RelStatus } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

const STATUS_STYLES: Record<RelStatus, { label: string; color: string }> = {
  strong:           { label: "Strong",          color: "text-brand-700 bg-brand-50"  },
  warm:             { label: "Warm",             color: "text-brand-600 bg-brand-50"  },
  "needs-attention":{ label: "Needs attention",  color: "text-amber-700 bg-amber-50"  },
};

function barColor(score: number): string {
  if (score >= 70) return "bg-brand-600";
  if (score >= 50) return "bg-brand-400";
  return "bg-brand-200";
}

function avatarColor(score: number): string {
  if (score >= 80) return "bg-brand-600 text-white";
  if (score >= 60) return "bg-brand-200 text-brand-800";
  return "bg-surface-border text-ink-subtle";
}

export function RelationshipsPanel({
  onMetricClick,
}: {
  onMetricClick: (metric: string, value: number, max: number) => void;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-border bg-surface-base">
        <Users className="size-4 text-brand-600 shrink-0" />
        <h3 className="text-sm font-semibold text-ink">Relationships</h3>
      </div>
      <ul className="divide-y divide-surface-border">
        {MOCK_RELATIONSHIPS.map((r) => {
          const st = STATUS_STYLES[r.status];
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onMetricClick(`relationship-${r.label}`, r.score, 100)}
                className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-base"
              >
                <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", avatarColor(r.score))}>
                  {r.label.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-ink">{r.label}</span>
                    <span className={cn("text-[10px] font-semibold rounded px-1", st.color)}>{st.label}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-surface-border">
                      <div className={cn("h-full rounded-full transition-all", barColor(r.score))} style={{ width: `${r.score}%` }} />
                    </div>
                    <span className="shrink-0 text-[10px] text-ink-faint tabular-nums">{r.score}/100</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-[11px] text-ink-faint">{r.lastContact}</div>
                  <div className="mt-0.5 text-[11px] text-ink-faint group-hover:text-brand-600 transition-colors">
                    suggest →
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
