"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  Activity,
  ScrollText,
  ChevronDown,
  ChevronUp,
  Play,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/",        label: "Overview",  icon: LayoutDashboard, exact: true },
  { href: "/console", label: "Console",   icon: MessageSquare,   exact: false },
  { href: "/calendar",label: "Calendar",  icon: CalendarDays,    exact: false },
  { href: "/activity",label: "Activity",  icon: Activity,        exact: false },
  { href: "/feedback",label: "Feedback",  icon: ScrollText,      exact: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const [jobsOpen, setJobsOpen] = useState(false);
  const [jobBusy, setJobBusy] = useState<"hourly" | "daily" | null>(null);

  async function runJob(kind: "hourly" | "daily") {
    setJobBusy(kind);
    try {
      await fetch(`/api/runs/${kind}`, { method: "POST" });
    } finally {
      setJobBusy(null);
    }
  }

  return (
    <aside className="flex h-screen w-52 shrink-0 flex-col bg-white border-r border-surface-border">
      {/* Logo */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-600 shadow-sm">
            <Zap className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink leading-none">Phuko</p>
            <p className="text-[11px] text-ink-faint leading-none mt-0.5">Schedule OS</p>
          </div>
        </div>
      </div>

      <div className="mx-3 h-px bg-surface-border" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-2.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-ink-muted hover:bg-surface-base hover:text-ink"
              )}
            >
              <Icon
                className={cn("size-4 shrink-0", active ? "text-brand-600" : "opacity-65")}
                aria-hidden
              />
              {label}
              {active && (
                <span className="ml-auto size-1.5 rounded-full bg-brand-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-border p-2">
        <button
          type="button"
          onClick={() => setJobsOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-faint hover:bg-surface-base hover:text-ink-muted transition-colors"
        >
          <span>Background jobs</span>
          {jobsOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        {jobsOpen && (
          <div className="mt-1 space-y-1 px-1 pb-1">
            {(["hourly", "daily"] as const).map((kind) => (
              <Button
                key={kind}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-full justify-start gap-1.5 text-xs"
                disabled={jobBusy !== null}
                onClick={() => void runJob(kind)}
              >
                <Play className="size-3" />
                {jobBusy === kind ? "Running…" : `Run ${kind}`}
              </Button>
            ))}
          </div>
        )}
        <p className="px-2.5 py-1.5 text-[10px] text-ink-faint">
          {process.env.NEXT_PUBLIC_LLM_PROVIDER ?? "gemini"}
        </p>
      </div>
    </aside>
  );
}
