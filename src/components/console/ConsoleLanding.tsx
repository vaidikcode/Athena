"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Zap,
  CalendarDays,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  FileText,
  MessageSquare,
  Globe,
  RefreshCw,
  ArrowRight,
  Cpu,
  Eye,
  PenLine,
  Radio,
  TrendingUp,
  Search,
} from "lucide-react";
import { MOCK_DATA_SOURCES } from "@/lib/mock/data";

interface Props {
  onSend: (text: string) => void;
}

/* ─── Quick actions ──────────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  {
    icon: TrendingUp,
    label: "Find bottlenecks",
    sub: "Diagnose today's load & conflicts",
    prompt: "Analyse today's schedule: find bottlenecks, rule violations, and conflicts. Use render_day_timeline and find_conflicts widgets.",
    color: "text-brand-600 bg-brand-50 border-brand-200",
    accent: "brand",
  },
  {
    icon: CalendarDays,
    label: "Today's timeline",
    sub: "Visual breakdown of your day",
    prompt: "Show me today's full timeline using render_day_timeline.",
    color: "text-sky-600 bg-sky-50 border-sky-200",
    accent: "sky",
  },
  {
    icon: AlertTriangle,
    label: "Spot conflicts",
    sub: "Overlapping or back-to-back events",
    prompt: "Find all scheduling conflicts today and show them as conflict cards.",
    color: "text-amber-600 bg-amber-50 border-amber-200",
    accent: "amber",
  },
  {
    icon: BarChart3,
    label: "Workload check",
    sub: "Time allocation by type",
    prompt: "Show my workload summary for today using render_load.",
    color: "text-violet-600 bg-violet-50 border-violet-200",
    accent: "violet",
  },
  {
    icon: ShieldCheck,
    label: "Review rules",
    sub: "Check rule violations",
    prompt: "List my active rules and check if today's calendar violates any of them.",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    accent: "emerald",
  },
  {
    icon: Search,
    label: "Free slot",
    sub: "Find space for a new task",
    prompt: "Find free slots in my schedule today where I could add a 1-hour deep work session.",
    color: "text-rose-600 bg-rose-50 border-rose-200",
    accent: "rose",
  },
] as const;

/* ─── Capability groups ──────────────────────────────────────────────────── */
const CAPS = [
  {
    Icon: Eye,
    title: "Analyse",
    items: ["Timeline view", "Load chart", "Conflict detection", "Rule audit"],
  },
  {
    Icon: PenLine,
    title: "Act",
    items: ["Create events", "Move / reschedule", "Mark complete", "Cancel"],
  },
  {
    Icon: ShieldCheck,
    title: "Rules",
    items: ["Propose rules", "Edit rules", "Enforce guardrails", "AI suggestions"],
  },
  {
    Icon: Radio,
    title: "Signals",
    items: ["Notion pages", "Slack threads", "Google Docs", "Health stats"],
  },
] as const;

/* ─── Source icons ───────────────────────────────────────────────────────── */
const SRC_ICON: Record<string, typeof FileText> = {
  notion:       FileText,
  slack:        MessageSquare,
  "google-docs":FileText,
  browser:      Globe,
};

async function fetchRuleCount(): Promise<number> {
  try {
    const res = await fetch("/api/rules");
    if (!res.ok) return 0;
    const rules = (await res.json()) as Array<{ enabled: boolean }>;
    return rules.filter((r) => r.enabled).length;
  } catch {
    return 0;
  }
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export function ConsoleLanding({ onSend }: Props) {
  const { data: ruleCount = 0 } = useQuery({
    queryKey: ["rule-count"],
    queryFn: fetchRuleCount,
    staleTime: 60_000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-1 py-4 animate-fade-up">
      {/* ── Greeting ── */}
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 shadow-sm mt-0.5">
          <Zap className="size-5 text-white" />
        </div>
        <div>
          <p className="text-base font-bold text-ink">{greeting} — Console ready</p>
          <p className="text-xs text-ink-subtle mt-0.5 leading-relaxed">
            Your schedule intelligence assistant. Pick an action below or type anything.
          </p>
        </div>
      </div>

      {/* ── Quick actions grid ── */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Quick actions</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map(({ icon: Icon, label, sub, prompt, color }) => (
            <button
              key={label}
              type="button"
              onClick={() => onSend(prompt)}
              className={cn(
                "group flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all hover:shadow-sm active:scale-[0.98]",
                color
              )}
            >
              <Icon className="size-4 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-snug">{label}</p>
                <p className="text-[11px] opacity-75 leading-snug mt-0.5">{sub}</p>
              </div>
              <ArrowRight className="size-3 mt-0.5 ml-auto shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Connected sources + rules ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Sources */}
        <div className="rounded-xl border border-surface-border bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-2">
            Connected sources
          </p>
          <ul className="space-y-1.5">
            {MOCK_DATA_SOURCES.map((src) => {
              const Icon = SRC_ICON[src.id] ?? FileText;
              return (
                <li key={src.id} className="flex items-center gap-2">
                  <div className={cn("flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold", src.color)}>
                    {src.abbr}
                  </div>
                  <span className="text-xs font-medium text-ink flex-1 truncate">{src.label}</span>
                  <span className="flex items-center gap-1 text-[10px] text-ink-faint">
                    <span className="size-1.5 rounded-full bg-brand-500 inline-block" />
                    {src.eventCount}
                  </span>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => onSend("Fetch signals from all connected sources: emails, Slack, and health stats.")}
            className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            <RefreshCw className="size-3" />
            Sync all sources
          </button>
        </div>

        {/* Rules + capabilities */}
        <div className="rounded-xl border border-surface-border bg-white p-3 shadow-sm space-y-3">
          {/* Rules status */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-2">
              Rules engine
            </p>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 border border-brand-200">
                <ShieldCheck className="size-4 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">{ruleCount}</p>
                <p className="text-[11px] text-ink-faint leading-none">active rules</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSend("List all my active rules and check today's schedule against them.")}
              className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              <ArrowRight className="size-3" />
              Audit rules vs today
            </button>
          </div>

          <div className="h-px bg-surface-border" />

          {/* AI tools count */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1.5">
              AI tools
            </p>
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-ink-faint shrink-0" />
              <p className="text-[11px] text-ink-subtle leading-snug">
                15+ tools · display, read & write · HITL confirmation for mutations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Capabilities ── */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">What the console can do</p>
        <div className="grid grid-cols-4 gap-2">
          {CAPS.map(({ Icon, title, items }) => (
            <div key={title} className="rounded-xl border border-surface-border bg-white p-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="size-3.5 text-brand-600 shrink-0" />
                <p className="text-[11px] font-semibold text-ink">{title}</p>
              </div>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item} className="text-[10px] text-ink-subtle leading-snug">· {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Suggested prompt ── */}
      <button
        type="button"
        onClick={() => onSend("Give me a full briefing: today's timeline, bottlenecks, conflicts, rule violations, and top 3 actionable fixes.")}
        className="group w-full flex items-center gap-3 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-4 py-3 text-left hover:border-brand-400 hover:bg-brand-50 transition-all"
      >
        <Zap className="size-4 text-brand-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-brand-700">Full briefing</p>
          <p className="text-[11px] text-brand-600/70 leading-snug">
            Timeline · conflicts · bottlenecks · rule violations · actionable fixes
          </p>
        </div>
        <ArrowRight className="size-4 text-brand-600/50 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
      </button>
    </div>
  );
}
