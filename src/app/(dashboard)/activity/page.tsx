"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Play, Pause, CheckCircle2, AlertTriangle,
  Globe, MessageSquare, FileText, Bird, Code2, Clapperboard,
  Zap, Eye, Wifi, Clock, TrendingDown, TrendingUp, ShieldAlert,
  Monitor, BarChart2,
} from "lucide-react";
import { getDemoSourceEvents, localCalendarYmd } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

/* ── Data ──────────────────────────────────────────────────────────────────── */
const CURRENT_ACTIVITY = {
  scheduled: { title: "Deep Work: Product Spec", type: "focus", source: "notion" },
  detected:  { title: "Twitter / X — Feed browsing", type: "distraction" },
  alignment: 22,
};

const BROWSER_ACTIVITY = [
  { site: "twitter.com",  duration: "14 min", mins: 14, category: "distraction" as const, Icon: Bird,        bg: "bg-nb-coral",  text: "text-white" },
  { site: "notion.so",    duration: "8 min",  mins: 8,  category: "work"        as const, Icon: FileText,    bg: "bg-nb-green",  text: "text-black" },
  { site: "github.com",   duration: "6 min",  mins: 6,  category: "work"        as const, Icon: Code2,       bg: "bg-nb-blue",   text: "text-white" },
  { site: "youtube.com",  duration: "5 min",  mins: 5,  category: "distraction" as const, Icon: Clapperboard,bg: "bg-nb-orange", text: "text-black" },
];

const SRC_ICONS: Record<string, React.ElementType> = {
  notion:       FileText,
  slack:        MessageSquare,
  "google-docs":FileText,
  browser:      Globe,
};

const STATS = [
  { label: "Focus sessions", value: "3", sub: "today", Icon: Eye,        bg: "bg-nb-purple", text: "text-black" },
  { label: "Deep work mins", value: "94", sub: "of 120 target", Icon: Clock,  bg: "bg-nb-green",  text: "text-black" },
  { label: "Distractions",   value: "7",  sub: "detected",     Icon: ShieldAlert, bg: "bg-nb-coral", text: "text-white" },
  { label: "Efficiency",     value: "68%",sub: "vs 80% goal",  Icon: BarChart2, bg: "bg-nb-yellow", text: "text-black" },
];

/* ── Pomodoro timer ────────────────────────────────────────────────────────── */
function usePomodoroTimer(initialMinutes: number) {
  const [seconds, setSeconds] = useState(initialMinutes * 60);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [running]);

  const m   = Math.floor(seconds / 60);
  const s   = seconds % 60;
  const pct = seconds / (initialMinutes * 60);   // 1 → 0 as time passes
  const elapsed = 1 - pct;                        // 0 → 1

  return {
    display: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
    running,
    toggle: () => setRunning((r) => !r),
    elapsed,  // fraction consumed
    pct,      // fraction remaining
  };
}

/* ── Circular progress ring ────────────────────────────────────────────────── */
function RingTimer({ elapsed, display, running }: { elapsed: number; display: string; running: boolean }) {
  const R    = 90;
  const circ = 2 * Math.PI * R;
  const dash = circ * elapsed;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
      <svg width={220} height={220} className="-rotate-90 absolute inset-0">
        {/* Track */}
        <circle cx={110} cy={110} r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={14} />
        {/* Progress */}
        <circle
          cx={110} cy={110} r={R}
          fill="none"
          stroke="#FFD93D"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center">
        <span className="font-mono text-[3.5rem] font-black leading-none text-white tracking-tight">
          {display}
        </span>
        <span className="mt-1 text-xs font-black uppercase tracking-widest text-white/60">
          {running ? "remaining" : "paused"}
        </span>
      </div>
    </div>
  );
}

/* ── Marquee ───────────────────────────────────────────────────────────────── */
function Marquee({ items, bg = "bg-black text-white" }: { items: string[]; bg?: string }) {
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div className={cn("overflow-hidden border-y-[3px] border-black py-3.5", bg)}>
      <div className="flex animate-marquee whitespace-nowrap w-max">
        {repeated.map((t, i) => (
          <span key={i} className="inline-block mx-8 text-xl font-black uppercase tracking-widest">
            {t} <span className="text-nb-yellow">★</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Live status dot ───────────────────────────────────────────────────────── */
function LiveDot({ color = "bg-nb-green" }: { color?: string }) {
  return (
    <span className="relative flex size-3">
      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", color)} />
      <span className={cn("relative inline-flex size-3 rounded-full border-[2px] border-black", color)} />
    </span>
  );
}

/* ── Bar with label ────────────────────────────────────────────────────────── */
function AlignBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-white/70">Focus alignment</span>
        <span className="font-black text-white text-lg">{pct}%</span>
      </div>
      <div className="h-4 w-full rounded-full border-[2px] border-white/30 bg-white/10 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function ActivityPage() {
  const timer        = usePomodoroTimer(47);
  const demoEvents   = useMemo(() => getDemoSourceEvents(), []);
  const todayStr     = useMemo(() => localCalendarYmd(new Date()), []);
  const upcomingToday = demoEvents.filter((e) => e.date === todayStr).slice(0, 4);

  const totalMins    = BROWSER_ACTIVITY.reduce((a, b) => a + b.mins, 0);

  return (
    <div className="min-h-full overflow-y-auto bg-nb-cream selection:bg-black selection:text-nb-yellow">

      {/* ── TOP STATUS BAR ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b-[3px] border-black bg-black px-5 py-2.5">
        <div className="flex items-center gap-3">
          <LiveDot color="bg-nb-green" />
          <span className="text-xs font-black uppercase tracking-widest text-white">Focus Mode Active</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Monitor className="size-3.5 text-white/60" />
            <span className="text-xs font-bold text-white/60">Screen monitored</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi className="size-3.5 text-nb-green" />
            <span className="text-xs font-bold text-nb-green">Synced</span>
          </div>
        </div>
      </div>

      {/* ── HERO: TIMER + ALERT ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] border-b-[3px] border-black">

        {/* LEFT — Blue timer block */}
        <div className="relative overflow-hidden bg-nb-blue border-r-[3px] border-black px-8 py-10 dot-pattern-white">
          {/* background decorative icon */}
          <Zap className="absolute -bottom-8 -right-8 size-48 text-white/5 rotate-12" />

          {/* pill label */}
          <div className="inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-nb-yellow px-4 py-1.5 shadow-nb-sm mb-6">
            <LiveDot color="bg-black" />
            <span className="text-xs font-black uppercase tracking-widest text-black">Active block</span>
          </div>

          {/* Task title */}
          <h2 className="text-3xl font-black text-white leading-tight mb-2 uppercase tracking-tight max-w-md">
            {CURRENT_ACTIVITY.scheduled.title}
          </h2>
          <p className="text-sm font-bold text-white/60 mb-8">
            From Notion · Deep work session
          </p>

          {/* Ring + timer */}
          <div className="flex items-center gap-10">
            <RingTimer elapsed={timer.elapsed} display={timer.display} running={timer.running} />

            <div className="space-y-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-white/50 mb-1">Status</div>
                <div className={cn(
                  "inline-flex items-center gap-2 rounded-xl border-[2px] border-white/30 px-3 py-1.5 text-sm font-black",
                  timer.running ? "text-nb-green" : "text-nb-yellow"
                )}>
                  {timer.running
                    ? <><Play className="size-3.5 fill-current" /> Running</>
                    : <><Pause className="size-3.5 fill-current" /> Paused</>
                  }
                </div>
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-white/50 mb-1">Progress</div>
                <div className="text-2xl font-black text-white">{Math.round(timer.elapsed * 100)}%</div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={timer.toggle}
              className={cn(
                "flex items-center gap-2 rounded-2xl border-[3px] border-black px-6 py-3 text-sm font-black shadow-nb transition-all",
                "active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
                "hover:shadow-nb-md hover:-translate-x-[2px] hover:-translate-y-[2px]",
                timer.running ? "bg-white text-black" : "bg-nb-yellow text-black"
              )}
            >
              {timer.running
                ? <><Pause className="size-4 fill-current" /> Pause</>
                : <><Play className="size-4 fill-current" /> Resume</>
              }
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-2xl border-[3px] border-white/40 px-6 py-3 text-sm font-black text-white transition-all hover:border-white hover:bg-white/10"
            >
              <CheckCircle2 className="size-4" /> Mark done
            </button>
          </div>
        </div>

        {/* RIGHT — Distraction + Alignment stacked */}
        <div className="flex flex-col">

          {/* CORAL: Distraction alert */}
          <div className="flex-1 bg-nb-coral border-b-[3px] border-black px-6 py-7 relative overflow-hidden">
            <AlertTriangle className="absolute -bottom-4 -right-4 size-32 text-black/10" />
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="size-4 text-white" />
              <span className="text-xs font-black uppercase tracking-widest text-white/80">Focus drift detected</span>
            </div>
            <div className="text-7xl font-black text-white leading-none mb-1">{CURRENT_ACTIVITY.alignment}%</div>
            <div className="text-xs font-black text-white/70 mb-5 uppercase tracking-wide">alignment score</div>
            <div className="rounded-2xl border-[2px] border-white/30 bg-black/20 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Bird className="size-3.5 text-white" />
                <span className="text-xs font-black text-white truncate">{CURRENT_ACTIVITY.detected.title}</span>
              </div>
              <p className="text-[11px] font-bold text-white/70 leading-snug">
                Browser history shows social browsing during scheduled deep work. 14 min lost.
              </p>
            </div>
          </div>

          {/* YELLOW: Alignment bar */}
          <div className="bg-[#1a1a1a] border-b-[3px] border-black px-6 py-6">
            <AlignBar pct={CURRENT_ACTIVITY.alignment} color="bg-nb-coral" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border-[2px] border-white/10 bg-white/5 px-3 py-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingDown className="size-3 text-nb-coral" />
                  <span className="text-[10px] font-black uppercase tracking-wide text-white/50">Distracted</span>
                </div>
                <span className="text-lg font-black text-nb-coral">14 min</span>
              </div>
              <div className="rounded-xl border-[2px] border-white/10 bg-white/5 px-3 py-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp className="size-3 text-nb-green" />
                  <span className="text-[10px] font-black uppercase tracking-wide text-white/50">On task</span>
                </div>
                <span className="text-lg font-black text-nb-green">33 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b-[3px] border-black">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "flex flex-col justify-between px-5 py-5 border-r-[3px] border-black last:border-r-0",
              s.bg
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-60", s.text)}>{s.label}</span>
              <div className={cn("flex size-7 items-center justify-center rounded-xl border-[2px] border-black bg-black/10", s.text)}>
                <s.Icon className="size-3.5" />
              </div>
            </div>
            <div>
              <div className={cn("text-4xl font-black leading-none", s.text)}>{s.value}</div>
              <div className={cn("text-xs font-bold mt-1 opacity-60", s.text)}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MARQUEE ─────────────────────────────────────────────────────────── */}
      <Marquee
        items={["Browser history", "30 minutes tracked", "Focus drift detected", "7 distractions", "Session monitoring"]}
        bg="bg-black text-white"
      />

      {/* ── BROWSER ACTIVITY ─────────────────────────────────────────────────── */}
      <div className="px-5 py-7 border-b-[3px] border-black">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight">Browser activity</h3>
            <p className="text-xs font-bold text-black/50 mt-0.5">Last 30 minutes · {totalMins} min total</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border-[3px] border-black bg-white px-4 py-2 shadow-nb-sm">
            <Globe className="size-4 text-black" />
            <span className="text-xs font-black text-black">4 sites</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {BROWSER_ACTIVITY.map((a) => (
            <div
              key={a.site}
              className={cn(
                "rounded-2xl border-[3px] border-black p-5 shadow-nb transition-all",
                "hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-nb-md",
                a.bg
              )}
            >
              {/* Icon */}
              <div className={cn("mb-4 flex size-12 items-center justify-center rounded-xl border-[2px] border-black bg-black/10")}>
                <a.Icon className={cn("size-6", a.text)} />
              </div>

              {/* Site */}
              <div className={cn("text-lg font-black leading-tight truncate mb-1", a.text)}>{a.site}</div>

              {/* Duration */}
              <div className={cn("font-mono text-3xl font-black leading-none mb-3", a.text)}>{a.duration}</div>

              {/* Bar */}
              <div className="h-2 w-full rounded-full border-[1px] border-black/20 bg-black/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-black/25"
                  style={{ width: `${(a.mins / 14) * 100}%` }}
                />
              </div>

              {/* Category pill */}
              <div className="mt-3">
                <span className={cn(
                  "inline-flex items-center rounded-full border-[2px] border-black px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                  a.category === "work" ? "bg-black text-white" : "bg-white text-black"
                )}>
                  {a.category === "distraction" ? "⚡ distraction" : "✓ work"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECOND MARQUEE ──────────────────────────────────────────────────── */}
      <Marquee
        items={["Upcoming events", "Schedule on track", "Deep work block", "2 meetings today"]}
        bg="bg-nb-yellow text-black"
      />

      {/* ── UPCOMING TODAY ──────────────────────────────────────────────────── */}
      <div className="px-5 py-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight">Upcoming today</h3>
            <p className="text-xs font-bold text-black/50 mt-0.5">{upcomingToday.length} events scheduled</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {upcomingToday.length === 0 && (
            <div className="col-span-4 rounded-2xl border-[3px] border-black bg-white p-10 text-center shadow-nb">
              <CheckCircle2 className="mx-auto size-10 text-nb-green mb-3" />
              <p className="font-black text-black">You're all caught up!</p>
              <p className="text-sm font-bold text-black/50 mt-1">No more events for today</p>
            </div>
          )}
          {upcomingToday.map((ev, idx) => {
            const Icon = SRC_ICONS[ev.source] ?? Globe;
            const cardColors = [
              { bg: "bg-nb-blue",   text: "text-white", iconBg: "bg-white/20" },
              { bg: "bg-nb-purple", text: "text-black",  iconBg: "bg-black/10" },
              { bg: "bg-nb-green",  text: "text-black",  iconBg: "bg-black/10" },
              { bg: "bg-white",     text: "text-black",  iconBg: "bg-nb-cream" },
            ];
            const col = cardColors[idx % cardColors.length];

            return (
              <div
                key={ev.id}
                className={cn(
                  "rounded-2xl border-[3px] border-black p-5 shadow-nb transition-all",
                  "hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-nb-md",
                  col.bg
                )}
              >
                <div className={cn("mb-4 flex size-10 items-center justify-center rounded-xl border-[2px] border-black", col.iconBg)}>
                  <Icon className={cn("size-5", col.text)} />
                </div>
                <div className={cn("font-black text-base leading-snug mb-2", col.text)}>{ev.title}</div>
                <div className={cn("font-mono text-xs font-bold opacity-60", col.text)}>
                  {ev.time} · {ev.duration} min
                </div>
                <div className="mt-3">
                  <span className={cn(
                    "inline-block rounded-full border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wide capitalize",
                    col.text, "bg-black/10 border-black/20"
                  )}>
                    {ev.source}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
