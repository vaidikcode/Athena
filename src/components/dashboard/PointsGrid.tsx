"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ScrollText,
  CircleDollarSign,
  Briefcase,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { MOCK_POINTS } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const POINT_META: Record<
  keyof typeof MOCK_POINTS,
  { label: string; Icon: LucideIcon }
> = {
  health:    { label: "Health",    Icon: Activity },
  knowledge: { label: "Knowledge", Icon: ScrollText },
  money:     { label: "Money",     Icon: CircleDollarSign },
  work:      { label: "Work",      Icon: Briefcase },
};

function streakMultiplier(streakWeeks: number): number {
  if (streakWeeks >= 10) return 1.25;
  if (streakWeeks >= 6)  return 1.15;
  if (streakWeeks >= 3)  return 1.1;
  if (streakWeeks >= 1)  return 1.05;
  return 1;
}

function formatMult(m: number): string {
  if (m <= 1) return "×1";
  const n = Math.round(m * 100) / 100;
  return `×${n}`;
}

type MetricKey = keyof typeof POINT_META;

function PointRow({
  metricKey,
  onMetricClick,
}: {
  metricKey: MetricKey;
  onMetricClick: (metric: string, value: number, max: number) => void;
}) {
  const data = MOCK_POINTS[metricKey];
  const meta = POINT_META[metricKey];
  const { Icon } = meta;
  const mult = streakMultiplier(data.streakWeeks);
  const basePct = (data.value / data.max) * 100;
  const boosted = Math.min(100, Math.round(basePct * mult));

  return (
    <li>
      <button
        type="button"
        onClick={() => onMetricClick(metricKey, data.value, data.max)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-surface-base transition-colors"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 border border-brand-200">
          <Icon className="size-4 text-brand-600" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-ink">{meta.label}</span>
            <span className="text-base font-bold text-ink tabular-nums">
              {boosted}
              <span className="text-xs font-normal text-ink-faint">/100</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-border overflow-hidden">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${boosted}%` }} />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[11px] text-ink-faint">{data.streakWeeks}w streak</span>
            {mult > 1 && (
              <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 rounded px-1">
                {formatMult(mult)}
              </span>
            )}
            <span className={cn("ml-auto flex items-center gap-0.5 text-[11px] font-medium", data.trend === "up" ? "text-brand-700" : "text-ink-faint")}>
              {data.trend === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {data.delta > 0 ? "+" : ""}{data.delta}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}

export function PointsGrid({ onMetricClick }: { onMetricClick: (metric: string, value: number, max: number) => void }) {
  return (
    <div className="rounded-xl border border-surface-border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-border bg-surface-base">
        <BarChart3 className="size-4 text-brand-600 shrink-0" />
        <h3 className="text-sm font-semibold text-ink">Life scores</h3>
      </div>
      <p className="px-5 py-3 text-xs text-ink-subtle border-b border-surface-border">
        Streak multiplier: sustained weekly consistency raises your displayed score.
      </p>
      <ul className="divide-y divide-surface-border">
        {(Object.keys(POINT_META) as MetricKey[]).map((k) => (
          <PointRow key={k} metricKey={k} onMetricClick={onMetricClick} />
        ))}
      </ul>
    </div>
  );
}
