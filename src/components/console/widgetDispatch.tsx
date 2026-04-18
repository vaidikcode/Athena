"use client";

import { DayTimeline } from "./widgets/DayTimeline";
import { EventCard } from "./widgets/EventCard";
import { SlotPicker, type SlotCandidate } from "./widgets/SlotPicker";
import { ConflictPair } from "./widgets/ConflictPair";
import { RuleProposal } from "./widgets/RuleProposal";
import { ConfirmBar } from "./widgets/ConfirmBar";
import { CollectorPing } from "./widgets/CollectorPing";
import { LoadChart } from "./widgets/LoadChart";
import type { CalEvent } from "@/components/calendar/types";

const COLLECTOR_TOOLS = new Set([
  "fetch_emails_last_hour",
  "fetch_slack_last_hour",
  "fetch_health_stats",
]);

const HITL_TOOLS = new Set(["create_rule", "update_event", "delete_event"]);

/** Context callbacks passed from Thread so widgets can drive the conversation. */
export interface WidgetContext {
  sendMessage: (text: string) => void;
  /** toolCallId, toolName, output */
  addToolResult: (toolCallId: string, toolName: string, result: unknown) => void;
  onEventReschedule?: (ev: CalEvent) => void;
}

export interface ToolPart {
  type: string;
  toolCallId?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
}

/** Safely coerce a tool output to an object.
 *  The AI SDK sometimes delivers the output as a JSON string instead of a
 *  parsed value, so we defensively parse it here. */
function coerceOutput(raw: unknown): Record<string, unknown> | unknown[] | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown> | unknown[];
    } catch {
      // not JSON — fall through
    }
    return null;
  }
  if (typeof raw === "object") return raw as Record<string, unknown> | unknown[];
  return null;
}

/** Returns a React element for a tool part, or null if no widget is registered. */
export function dispatchWidget(part: ToolPart, ctx: WidgetContext): React.ReactNode {
  const toolName = part.type.startsWith("tool-") ? part.type.slice(5) : part.type;
  const state = part.state ?? "output-available";
  const input = (part.input ?? {}) as Record<string, unknown>;
  const output = coerceOutput(part.output) as Record<string, unknown> | null | undefined;
  const toolCallId = part.toolCallId ?? "";

  // Collector pings — just show a slim summary when done
  if (COLLECTOR_TOOLS.has(toolName) && state === "output-available") {
    return <CollectorPing toolName={toolName} output={output} />;
  }

  // Bind addToolResult for this specific tool name
  const addResult = (tcId: string, result: unknown) => ctx.addToolResult(tcId, toolName, result);

  // HITL: tools that need user confirmation before executing
  if (HITL_TOOLS.has(toolName) && (state === "approval-requested" || state === "input-available")) {
    if (toolName === "create_rule") {
      const ruleInput = input as {
        title?: string;
        body?: string;
        priority?: number;
        tags?: string[];
      };
      return (
        <RuleProposal
          toolCallId={toolCallId}
          rule={{
            title: ruleInput.title ?? "",
            body: ruleInput.body ?? "",
            priority: ruleInput.priority ?? 5,
            tags: ruleInput.tags ?? [],
          }}
          addToolResult={addResult}
        />
      );
    }
    return (
      <ConfirmBar
        toolCallId={toolCallId}
        toolName={toolName}
        input={input}
        addToolResult={addResult}
        label={
          toolName === "delete_event"
            ? `Confirm: cancel event${input.id ? ` (${input.id})` : ""}`
            : toolName === "update_event"
              ? `Confirm: update event${input.id ? ` (${input.id})` : ""}`
              : undefined
        }
      />
    );
  }

  if (state !== "output-available" || !output) return null;

  // list_events / render_day_timeline → DayTimeline
  if (toolName === "list_events" || toolName === "render_day_timeline" || toolName === "fetch_window_events") {
    let events: CalEvent[] = [];
    if (Array.isArray(output)) {
      events = output as CalEvent[];
    } else if (output && "events" in output && Array.isArray(output.events)) {
      events = output.events as CalEvent[];
    }
    if (events.length === 0) return null;
    const date =
      (input.from as string | undefined) ??
      (input.date as string | undefined) ??
      new Date().toISOString().slice(0, 10);
    return (
      <DayTimeline
        events={events}
        date={date.slice(0, 10)}
        onEventClick={(ev) => ctx.sendMessage(`Tell me about event "${ev.title}" (${ev.id}).`)}
      />
    );
  }

  // get_event → EventCard
  if (toolName === "get_event") {
    const ev = (output.event ?? output) as CalEvent | null;
    if (!ev || !ev.id) return null;
    return (
      <EventCard
        event={ev}
        onSendMessage={ctx.sendMessage}
        onReschedule={ctx.onEventReschedule}
      />
    );
  }

  // propose_slots → SlotPicker
  if (toolName === "propose_slots") {
    const candidates = (output.candidates ?? []) as SlotCandidate[];
    const eventId = (output.eventId ?? input.eventId ?? "") as string;
    const eventTitle = output.eventTitle as string | undefined;
    return (
      <SlotPicker
        eventId={eventId}
        eventTitle={eventTitle}
        candidates={candidates}
        onSelect={(slot) =>
          ctx.sendMessage(
            `Move event ${eventId}${eventTitle ? ` ("${eventTitle}")` : ""} to ${slot.startIso} – ${slot.endIso}.`
          )
        }
      />
    );
  }

  // find_conflicts → ConflictPairs
  if (toolName === "find_conflicts") {
    let pairs: Array<[CalEvent, CalEvent]> = [];
    if (Array.isArray(output)) {
      pairs = output as Array<[CalEvent, CalEvent]>;
    } else if (output?.pairs && Array.isArray(output.pairs)) {
      pairs = output.pairs as Array<[CalEvent, CalEvent]>;
    }
    if (pairs.length === 0) return null;
    return (
      <div className="space-y-3">
        {pairs.slice(0, 4).map(([a, b], i) => (
          <ConflictPair key={i} pairA={a} pairB={b} onSendMessage={ctx.sendMessage} />
        ))}
      </div>
    );
  }

  // summarize_load / render_load → LoadChart
  if (toolName === "summarize_load" || toolName === "render_load") {
    return <LoadChart load={output} />;
  }

  // list_event_logs → slim log strip (plain text list is fine)
  if (toolName === "list_event_logs") {
    const logs = Array.isArray(output) ? output : (output.logs as unknown[] | undefined) ?? [];
    if (logs.length === 0) return null;
    return (
      <div className="rounded-xl border border-[3px] border-black bg-white overflow-hidden shadow-sm">
        <div className="px-3.5 py-2.5 border-b border-surface-border bg-nb-cream">
          <p className="text-xs font-bold text-ink">Event history ({logs.length})</p>
        </div>
        <ul className="divide-y divide-surface-border/60 max-h-48 overflow-y-auto">
          {(logs as Array<Record<string, unknown>>).map((log, i) => (
            <li key={i} className="px-3.5 py-1.5 flex items-center gap-3 text-[11px] text-ink-subtle">
              <span className="font-bold text-ink capitalize">{String(log.action ?? "")}</span>
              <span className="text-ink-faint">·</span>
              <span>{String(log.actor ?? "")}</span>
              <span className="ml-auto text-ink-faint">
                {log.at ? new Date(String(log.at)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}
