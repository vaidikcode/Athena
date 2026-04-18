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
    <aside className="flex h-screen w-52 shrink-0 flex-col bg-nb-yellow border-r-[3px] border-black shadow-[4px_0px_0px_0px_rgba(0,0,0,0.15)]">
      {/* Logo */}
      <div className="px-4 py-4 border-b-[3px] border-black">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-black shadow-nb-sm">
            <Zap className="size-5 text-nb-yellow" />
          </div>
          <div>
            <p className="text-sm font-black text-black leading-none">Athena</p>
            <p className="text-[11px] font-bold text-black/60 leading-none mt-0.5">Schedule OS</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-2 pt-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all border-[3px]",
                active
                  ? "bg-white border-black shadow-nb-sm text-black"
                  : "border-transparent text-black/70 hover:bg-white/60 hover:border-black hover:text-black"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t-[3px] border-black p-2">
        <button
          type="button"
          onClick={() => setJobsOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold text-black/60 hover:bg-white/60 hover:text-black transition-colors border-[2px] border-transparent hover:border-black"
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
        <p className="px-2.5 py-1 text-[10px] font-bold text-black/40 bg-[#fff4c2] rounded-lg mt-1">
          {process.env.NEXT_PUBLIC_LLM_PROVIDER ?? "gemini"}
        </p>
      </div>
    </aside>
  );
}
