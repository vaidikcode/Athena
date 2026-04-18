"use client";

import { useEffect, useState, useMemo } from "react";
import { AlertTriangle, Globe, MessageSquare, FileText, Bird, Code2, Clapperboard } from "lucide-react";
import { getDemoSourceEvents, localCalendarYmd } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const CURRENT_ACTIVITY = {
  scheduled: { title: "Deep Work: Product Spec", type: "focus", source: "notion" },
  detected: { title: "Twitter / X — Feed browsing", type: "distraction" },
  alignment: 22,
};

const BROWSER_ACTIVITY = [
  { site: "twitter.com", duration: "14 min", category: "distraction" as const, Icon: Bird },
  { site: "notion.so", duration: "8 min", category: "work" as const, Icon: FileText },
  { site: "github.com", duration: "6 min", category: "work" as const, Icon: Code2 },
  { site: "youtube.com", duration: "5 min", category: "distraction" as const, Icon: Clapperboard },
];

const SOURCE_ICONS: Record<string, React.ElementType> = {
  notion: FileText,
  slack: MessageSquare,
  "google-docs": FileText,
  browser: Globe,
};

function usePomodoroTimer(initialMinutes: number) {
  const [seconds, setSeconds] = useState(initialMinutes * 60);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [running]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return {
    display: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
    running,
    toggle: () => setRunning((r) => !r),
    pct: (seconds / (initialMinutes * 60)) * 100,
  };
}

export default function ActivityPage() {
  const timer = usePomodoroTimer(47);
  const demoEvents = useMemo(() => getDemoSourceEvents(), []);
  const todayStr = useMemo(() => localCalendarYmd(new Date()), []);
  const upcomingToday = demoEvents.filter((e) => e.date === todayStr).slice(0, 3);

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <div>
          <h1 className="text-athens-display text-athens-blue">Activity Mode</h1>
          <p className="text-athens-small mt-0.5 font-light text-athens-blue/70">Real-time focus tracking</p>
        </div>

        <div className="m-2 p-2">
          <div className="border border-athens-stone bg-athens-highlight p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="size-2 animate-pulse rounded-full bg-athens-blue" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-athens-blue/80">Active block</span>
                </div>
                <h2 className="text-lg font-bold text-athens-blue">{CURRENT_ACTIVITY.scheduled.title}</h2>
                <p className="mt-0.5 text-sm font-light text-athens-blue/75">From Notion · Deep work</p>
              </div>
              <div className="text-right">
                <div className="font-mono text-4xl font-bold text-athens-blue">{timer.display}</div>
                <div className="mt-1 text-xs font-light text-athens-blue/60">remaining</div>
              </div>
            </div>

            <div className="mt-4 h-2 w-full rounded-full bg-athens-stone">
              <div
                className="h-full rounded-full bg-athens-blue transition-all duration-1000"
                style={{ width: `${100 - timer.pct}%` }}
              />
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={timer.toggle}
                className="rounded-xl bg-athens-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-athens-blue/90"
              >
                {timer.running ? "Pause" : "Resume"}
              </button>
              <button
                type="button"
                className="rounded-xl border border-athens-stone bg-white px-4 py-2 text-sm font-semibold text-athens-blue transition-colors hover:bg-athens-highlight"
              >
                Mark done
              </button>
            </div>
          </div>
        </div>

        <div className="m-2 p-2">
          <div className="border border-athens-stone bg-athens-highlight p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-athens-blue" aria-hidden />
              <span className="text-sm font-semibold text-athens-blue">Focus alignment</span>
              <span className="ml-auto text-xs font-bold text-athens-blue">{CURRENT_ACTIVITY.alignment}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-athens-stone">
              <div className="h-full rounded-full bg-athens-blue" style={{ width: `${CURRENT_ACTIVITY.alignment}%` }} />
            </div>
            <div className="mt-3 text-xs font-light text-athens-blue/80">
              <span className="font-semibold">Detected:</span> {CURRENT_ACTIVITY.detected.title} — browser history
              shows social media browsing during scheduled deep work block.
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-athens-blue">Last 30 min — browser activity</h3>
          <div className="overflow-hidden rounded-2xl border border-athens-stone bg-white shadow-sm">
            {BROWSER_ACTIVITY.map((a, i) => (
              <div
                key={a.site}
                className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-athens-stone")}
              >
                <span className="flex size-9 shrink-0 items-center justify-center border border-athens-stone bg-athens-highlight text-athens-blue">
                  <a.Icon className="size-4" aria-hidden />
                </span>
                <span className="flex-1 text-sm text-athens-blue">{a.site}</span>
                <span className="text-xs font-light text-athens-blue/50">{a.duration}</span>
                <span
                  className={cn(
                    "rounded-full border border-athens-stone px-2 py-0.5 text-[10px] font-semibold capitalize",
                    a.category === "work" ? "bg-athens-highlight text-athens-blue" : "bg-athens-stone text-athens-blue"
                  )}
                >
                  {a.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-athens-blue">Upcoming today</h3>
          <div className="space-y-2">
            {upcomingToday.map((ev) => {
              const Icon = SOURCE_ICONS[ev.source] ?? Globe;
              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 rounded-xl border border-athens-stone bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex size-8 items-center justify-center rounded-lg border border-athens-stone bg-athens-highlight">
                    <Icon className="size-4 text-athens-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-athens-blue">{ev.title}</div>
                    <div className="text-xs font-light text-athens-blue/55">
                      {ev.time} · {ev.duration}min
                    </div>
                  </div>
                  <span className="text-[10px] font-light capitalize text-athens-blue/50">{ev.source}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
