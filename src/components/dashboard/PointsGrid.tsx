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

/* Each metric gets its own neobrutalist accent color */
const POINT_META: Record<
  keyof typeof MOCK_POINTS,
  { label: string; Icon: LucideIcon; bg: string; iconColor: string }
> = {
  health:    { label: "Health",    Icon: Activity,         bg: "bg-nb-coral",  iconColor: "text-white" },
  knowledge: { label: "Knowledge", Icon: ScrollText,       bg: "bg-nb-purple", iconColor: "text-black" },
  money:     { label: "Money",     Icon: CircleDollarSign, bg: "bg-nb-green",  iconColor: "text-black" },
  work:      { label: "Work",      Icon: Briefcase,        bg: "bg-nb-blue",   iconColor: "text-white" },
};

const BAR_COLORS: Record<keyof typeof MOCK_POINTS, string> = {
  health:    "#FF6B6B",
  knowledge: "#A29BFE",
  money:     "#6BCB77",
  work:      "#4D96FF",
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
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-nb-yellow/20 transition-colors"
      >
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border-[2px] border-black shadow-nb-sm", meta.bg)}>
          <Icon className={cn("size-4", meta.iconColor)} aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-black text-black">{meta.label}</span>
            <span className="text-base font-black text-black tabular-nums">
              {boosted}
              <span className="text-xs font-bold text-black/40">/100</span>
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full rounded-full bg-black/10 overflow-hidden border border-black/20">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${boosted}%`, background: BAR_COLORS[metricKey] }}
            />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[11px] font-bold text-black/50">{data.streakWeeks}w streak</span>
            {mult > 1 && (
              <span className="text-[11px] font-black text-black bg-nb-yellow border border-black rounded px-1">
                {formatMult(mult)}
              </span>
            )}
            <span className={cn("ml-auto flex items-center gap-0.5 text-[11px] font-black", data.trend === "up" ? "text-nb-green" : "text-nb-coral")}>
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
    <div className="rounded-2xl border-[3px] border-black bg-white overflow-hidden shadow-nb">
      <div className="flex items-center gap-2 px-5 py-3 border-b-[3px] border-black bg-nb-green">
        <BarChart3 className="size-4 text-black shrink-0" />
        <h3 className="text-sm font-black text-black">Life scores</h3>
      </div>
      <p className="px-5 py-2 text-xs font-bold text-black/50 border-b-[2px] border-black/20 bg-nb-cream">
        Streak multiplier: sustained weekly consistency raises your displayed score.
      </p>
      <ul className="divide-y-[2px] divide-black/10">
        {(Object.keys(POINT_META) as MetricKey[]).map((k) => (
          <PointRow key={k} metricKey={k} onMetricClick={onMetricClick} />
        ))}
      </ul>
    </div>
  );
}
