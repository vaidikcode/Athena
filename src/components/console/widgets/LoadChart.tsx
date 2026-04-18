"use client";

import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  deep_work: "#4D96FF",
  meeting:   "#4ade80",
  admin:     "#86efac",
  personal:  "#bbf7d0",
  health:    "#15803d",
  learning:  "#22c55e",
  social:    "#a3e635",
  other:     "#d1fae5",
};

interface LoadData {
  totalMinutesByType?: Record<string, number>;
  totalMinutesByEnergy?: Record<string, number>;
  highPriorityCount?: number;
  backToBackCount?: number;
  totalEvents?: number;
}

interface Props {
  load: LoadData;
  className?: string;
}

export function LoadChart({ load, className }: Props) {
  const byType = load.totalMinutesByType ?? {};
  const total = Object.values(byType).reduce((s, v) => s + v, 0);

  const segments = Object.entries(byType)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className={cn("rounded-xl border border-[3px] border-black bg-white p-3 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-ink">Load summary</p>
        <p className="text-[11px] text-black/40">{Math.round(total / 60)}h {total % 60}m</p>
      </div>

      {total > 0 ? (
        <>
          {/* Stacked bar */}
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-surface-border/60">
            {segments.map(([type, mins]) => (
              <div
                key={type}
                style={{ width: `${(mins / total) * 100}%`, background: TYPE_COLORS[type] ?? "#ccc" }}
                title={`${type}: ${mins} min`}
                className="h-full transition-all"
              />
            ))}
          </div>

          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {segments.map(([type, mins]) => (
              <span key={type} className="flex items-center gap-1 text-[11px] text-black/60">
                <span
                  className="inline-block size-2 rounded-sm flex-shrink-0"
                  style={{ background: TYPE_COLORS[type] ?? "#ccc" }}
                />
                {type.replace("_", " ")} {mins}m
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs font-bold text-nb-blue/50">No events scheduled</p>
      )}

      <div className="mt-2 flex gap-4 text-[11px] text-nb-blue/60 border-t border-black pt-2">
        {load.backToBackCount !== undefined && (
          <span>
            <strong className="text-nb-blue">{load.backToBackCount}</strong> back-to-back
          </span>
        )}
        {load.highPriorityCount !== undefined && (
          <span>
            <strong className="text-nb-blue">{load.highPriorityCount}</strong> high priority
          </span>
        )}
        {load.totalEvents !== undefined && (
          <span>
            <strong className="text-nb-blue">{load.totalEvents}</strong> total events
          </span>
        )}
      </div>
    </div>
  );
}
