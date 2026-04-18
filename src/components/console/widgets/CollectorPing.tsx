"use client";

import { cn } from "@/lib/utils";
import { Mail, MessageSquare, Activity } from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  fetch_emails_last_hour: <Mail className="size-3 shrink-0" />,
  fetch_slack_last_hour: <MessageSquare className="size-3 shrink-0" />,
  fetch_health_stats: <Activity className="size-3 shrink-0" />,
};

const LABELS: Record<string, string> = {
  fetch_emails_last_hour: "Email signals",
  fetch_slack_last_hour: "Slack signals",
  fetch_health_stats: "Health stats",
};

interface Props {
  toolName: string;
  output?: unknown;
  className?: string;
}

function summarize(toolName: string, output: unknown): string {
  if (!output) return "No data";
  if (typeof output === "string") {
    try {
      const parsed = JSON.parse(output) as unknown;
      return summarize(toolName, parsed);
    } catch {
      return output.slice(0, 80);
    }
  }
  if (typeof output === "object" && output !== null) {
    if ("error" in output) return "Source unavailable";
    if (Array.isArray(output)) return `${output.length} items`;
    const keys = Object.keys(output);
    if (keys.length === 0) return "No data";
    return keys
      .slice(0, 3)
      .map((k) => `${k}: ${JSON.stringify((output as Record<string, unknown>)[k])}`)
      .join(" · ");
  }
  return String(output).slice(0, 80);
}

export function CollectorPing({ toolName, output, className }: Props) {
  const label = LABELS[toolName] ?? toolName.replace(/_/g, " ");
  const icon = ICONS[toolName] ?? <Activity className="size-3 shrink-0" />;
  const summary = summarize(toolName, output);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-black/70 bg-nb-cream/40 px-3 py-1.5 text-[11px] text-nb-blue/65",
        className
      )}
    >
      {icon}
      <span className="font-semibold">{label}</span>
      <span className="text-nb-blue/45">·</span>
      <span className="truncate">{summary}</span>
    </div>
  );
}
