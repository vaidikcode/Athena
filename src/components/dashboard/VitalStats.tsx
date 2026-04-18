"use client";

import { useEffect, useState } from "react";
import { Zap, Brain, Clock } from "lucide-react";
import { MOCK_METRICS } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const STROKE_TRACK = "#e2e8f0";
const STROKE_FILL  = "#16a34a";

function RadialBar({ value, max }: { value: number; max: number }) {
  const pct = value / max;
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <svg width="44" height="44" className="-rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke={STROKE_TRACK} strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={STROKE_FILL}
        strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

function useCountdown(minutesAway: number) {
  const [target] = useState(() => Date.now() + minutesAway * 60 * 1000);
  const [remaining, setRemaining] = useState(minutesAway * 60);

  useEffect(() => {
    const iv = setInterval(() => {
      const diff = Math.max(0, Math.round((target - Date.now()) / 1000));
      setRemaining(diff);
    }, 1000);
    return () => clearInterval(iv);
  }, [target]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${String(s).padStart(2, "0")}s`;
}

function bandLabel(score: number): { label: string; muted: boolean } {
  if (score >= 70) return { label: "Strong", muted: false };
  if (score >= 50) return { label: "Moderate", muted: true };
  return { label: "Low", muted: true };
}

export function VitalStats({ onMetricClick }: { onMetricClick: (metric: string, value: number, max: number) => void }) {
  const countdown = useCountdown(MOCK_METRICS.nextEvent.minutesAway);
  const energyBand = bandLabel(MOCK_METRICS.energy);
  const attentionBand = bandLabel(MOCK_METRICS.attentionScore);

  return (
    <div className="rounded-xl border border-surface-border bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-surface-border bg-surface-base">
        <h3 className="text-sm font-semibold text-ink">Vital statistics</h3>
      </div>
      <ul className="divide-y divide-surface-border">
        {/* Next event */}
        <li className="flex items-center gap-4 px-5 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 border border-brand-200">
            <Clock className="size-4 text-brand-600" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Next event</div>
            <div className="text-xl font-bold tabular-nums text-ink mt-0.5">{countdown}</div>
            <div className="text-xs text-ink-subtle truncate mt-0.5">{MOCK_METRICS.nextEvent.title}</div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="size-1.5 animate-pulse rounded-full bg-brand-600" />
              <span className="text-xs font-medium text-brand-700">Focus block</span>
            </div>
          </div>
        </li>

        {/* Energy */}
        <li>
          <button
            type="button"
            onClick={() => onMetricClick("energy", MOCK_METRICS.energy, 100)}
            className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-surface-base transition-colors"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 border border-brand-200">
              <Zap className="size-4 text-brand-600" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <RadialBar value={MOCK_METRICS.energy} max={100} />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-ink-faint">Energy</div>
                <div className="text-xl font-bold text-ink">
                  {MOCK_METRICS.energy}
                  <span className="text-sm font-normal text-ink-faint">/100</span>
                </div>
                <div className={cn("text-xs font-semibold", energyBand.muted ? "text-ink-faint" : "text-brand-700")}>
                  {energyBand.label}
                </div>
              </div>
            </div>
          </button>
        </li>

        {/* Attention */}
        <li>
          <button
            type="button"
            onClick={() => onMetricClick("attention", MOCK_METRICS.attentionScore, 100)}
            className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-surface-base transition-colors"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 border border-brand-200">
              <Brain className="size-4 text-brand-600" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <RadialBar value={MOCK_METRICS.attentionScore} max={100} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-ink-faint">Attention score</span>
                  <span className="text-[10px] text-ink-faint ml-auto">browser</span>
                </div>
                <div className="text-xl font-bold text-ink">
                  {MOCK_METRICS.attentionScore}
                  <span className="text-sm font-normal text-ink-faint">/100</span>
                </div>
                <div className={cn("text-xs font-semibold", attentionBand.muted ? "text-ink-faint" : "text-brand-700")}>
                  {MOCK_METRICS.attentionScore >= 70 ? "Sharp" : MOCK_METRICS.attentionScore >= 50 ? "Fragmented" : "Depleted"}
                </div>
              </div>
            </div>
          </button>
        </li>
      </ul>
    </div>
  );
}
