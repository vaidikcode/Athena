"use client";

import { MOCK_RELATIONSHIPS, type RelStatus } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

const STATUS_STYLES: Record<RelStatus, { label: string; bg: string; text: string }> = {
  strong:            { label: "Strong",         bg: "bg-nb-green",  text: "text-black" },
  warm:              { label: "Warm",            bg: "bg-nb-yellow", text: "text-black" },
  "needs-attention": { label: "Needs attention", bg: "bg-nb-coral",  text: "text-white" },
};

const BAR_COLORS = {
  high:   "#6BCB77",
  mid:    "#FFD93D",
  low:    "#FF6B6B",
};

function barColor(score: number): string {
  if (score >= 70) return BAR_COLORS.high;
  if (score >= 50) return BAR_COLORS.mid;
  return BAR_COLORS.low;
}

const AVATAR_COLORS = [
  "bg-nb-blue text-white",
  "bg-nb-purple text-black",
  "bg-nb-green text-black",
  "bg-nb-coral text-white",
  "bg-nb-orange text-black",
];

export function RelationshipsPanel({
  onMetricClick,
}: {
  onMetricClick: (metric: string, value: number, max: number) => void;
}) {
  return (
    <div className="rounded-2xl border-[3px] border-black bg-white overflow-hidden shadow-nb">
      <div className="flex items-center gap-2 px-5 py-3 border-b-[3px] border-black bg-nb-purple">
        <Users className="size-4 text-black shrink-0" />
        <h3 className="text-sm font-black text-black">Relationships</h3>
      </div>
      <ul className="divide-y-[2px] divide-black/10">
        {MOCK_RELATIONSHIPS.map((r, idx) => {
          const st = STATUS_STYLES[r.status];
          const avCol = AVATAR_COLORS[idx % AVATAR_COLORS.length];
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onMetricClick(`relationship-${r.label}`, r.score, 100)}
                className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-nb-yellow/20"
              >
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border-[2px] border-black text-sm font-black shadow-nb-sm", avCol)}>
                  {r.label.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-black text-black">{r.label}</span>
                    <span className={cn("text-[10px] font-black rounded px-1.5 py-0.5 border border-black/20", st.bg, st.text)}>
                      {st.label}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-black/10 border border-black/20 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${r.score}%`, background: barColor(r.score) }} />
                    </div>
                    <span className="shrink-0 text-[10px] font-black text-black/50 tabular-nums">{r.score}/100</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-[11px] font-bold text-black/40">{r.lastContact}</div>
                  <div className="mt-0.5 text-[11px] font-black text-black/40 group-hover:text-nb-blue transition-colors">
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
