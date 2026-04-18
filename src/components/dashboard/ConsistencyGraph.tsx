"use client";

import { useMemo } from "react";
import { getMockConsistency } from "@/lib/mock/data";

const days = getMockConsistency();

function buildLinePath(
  scores: number[],
  width: number,
  height: number,
  padX: number,
  padY: number
): string {
  if (scores.length === 0) return "";
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const n = scores.length;
  const pts = scores.map((s, i) => {
    const x = padX + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = padY + innerH * (1 - s / 100);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${pts.join(" L ")}`;
}

function buildAreaPath(
  scores: number[],
  width: number,
  height: number,
  padX: number,
  padY: number
): string {
  if (scores.length === 0) return "";
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const bottom = padY + innerH;
  const n = scores.length;
  const pts = scores.map((s, i) => {
    const x = padX + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = padY + innerH * (1 - s / 100);
    return [x, y] as [number, number];
  });
  const pathStr = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const lastX = pts[pts.length - 1][0];
  const firstX = pts[0][0];
  return `${pathStr} L ${lastX.toFixed(1)},${bottom} L ${firstX.toFixed(1)},${bottom} Z`;
}

export function ConsistencyGraph() {
  const avg = Math.round(days.reduce((s, d) => s + d.score, 0) / days.length);
  const chartW = 520;
  const chartH = 130;
  const padX = 8;
  const padY = 10;
  const pathD = useMemo(
    () => buildLinePath(days.map((d) => d.score), chartW, chartH, padX, padY),
    []
  );
  const areaD = useMemo(
    () => buildAreaPath(days.map((d) => d.score), chartW, chartH, padX, padY),
    []
  );

  const first = days[0]?.date ?? "";
  const last = days[days.length - 1]?.date ?? "";

  return (
    <div className="rounded-2xl border-[3px] border-black bg-white overflow-hidden shadow-nb">
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b-[3px] border-black bg-nb-orange">
        <div>
          <h3 className="text-sm font-black text-black">Consistency</h3>
          <p className="text-xs font-bold text-black/60 mt-0.5">Last 30 days · completion over time</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-black">{avg}%</div>
          <div className="text-[11px] font-bold text-black/60">Average</div>
        </div>
      </div>

      <div className="px-4 pt-3 pb-2">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="h-auto w-full max-h-36"
          role="img"
          aria-label={`Consistency scores over the last 30 days, averaging ${avg} percent`}
        >
          <defs>
            <linearGradient id="cgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4D96FF" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#4D96FF" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <line x1={padX} y1={chartH - padY} x2={chartW - padX} y2={chartH - padY} stroke="#000" strokeWidth={1.5} />
          <line x1={padX} y1={padY + (chartH - padY * 2) * 0.5} x2={chartW - padX} y2={padY + (chartH - padY * 2) * 0.5} stroke="#ccc" strokeWidth={1} strokeDasharray="4 4" />
          {/* Area fill */}
          <path d={areaD} fill="url(#cgGrad)" />
          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#4D96FF"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <div className="mt-1 flex justify-between text-[11px] tabular-nums font-bold text-black/50">
          <span>{first}</span>
          <span>{last}</span>
        </div>
      </div>
    </div>
  );
}
