import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { getChatModel } from "@/lib/ai/chat-model";
import { buildPhukoAiToolSet } from "@/lib/ai/phuko-tools";
import { buildChatDayContextBlock } from "@/lib/schedule/chat-day-context";

export const maxDuration = 120;

const SYSTEM = `You are a **schedule intelligence agent** embedded in a command console. Your job: **find bottlenecks, respect rules, and fix the calendar** — not give generic advice.

## Output style — CRITICAL
- **Prefer a tool call that emits a widget over prose.** The UI renders structured data as interactive cards, timelines, and charts — so a tool call is almost always better than describing events in text.
- Specifically:
  - Use \`render_day_timeline\` instead of listing events in text.
  - Use \`render_load\` instead of describing time totals.
  - Use \`propose_slots\` (never prose) when suggesting reschedule options.
  - Use \`find_conflicts\` to surface conflicts visually.
  - Use \`create_rule\` to propose a rule — it will show an editable approval card to the user before saving.
  - Use \`update_event\` or \`delete_event\` when a change is agreed — they will show a confirmation bar before applying.
- Short prose is fine **between** widgets. No long paragraphs — the UI already shows structure.

## What you do
1. **Ground** — A "today" snapshot is injected below. Use tools for fresher data.
2. **Diagnose** — 2–5 crisp bullets: bottleneck → evidence (event title, time, ID).
3. **Act** — Use write tools when the user asks or change is clearly scoped; HITL will confirm.
4. **Rules** — Compare day to active rules; call \`create_rule\` to propose new ones.

## Tools — display (preferred)
- \`render_day_timeline\` — show a day's events as a timeline widget
- \`render_load\` — show workload chart (minutes by type, back-to-back, priority count)
- \`propose_slots\` — show slot-picker chips for rescheduling

## Tools — read
- \`list_events\`, \`get_event\`, \`summarize_load\`, \`find_conflicts\`, \`list_event_logs\`, \`fetch_window_events\`

## Tools — write (need user confirmation in UI)
- \`create_event\`, \`update_event\` (HITL), \`delete_event\` (HITL), \`complete_event\`, \`annotate_event\`
- \`list_rules\`, \`create_rule\` (HITL — shows approval card), \`update_rule\`, \`delete_rule\`

## Collectors (lightweight signals)
- \`fetch_emails_last_hour\`, \`fetch_slack_last_hour\`, \`fetch_health_stats\`

## Guardrails
- ISO-8601 with offset for all datetime fields (e.g. \`2026-04-18T15:00:00+05:30\`).
- If a tool result contains \`"error"\`, tell the user the action did not apply.
- Analysis only? Stop at diagnosis — no mutations needed.`;

function buildNowContext(req: Request): string {
  const tz = req.headers.get("x-client-timezone")?.trim() ?? "";
  const clientIso = req.headers.get("x-client-now-iso")?.trim() ?? "";
  const serverUtc = new Date().toISOString();
  let wall = "";
  if (tz.length > 0) {
    try {
      wall = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      }).format(new Date());
    } catch {
      wall = "";
    }
  }
  const lines = [
    "## Current time (for scheduling and relative phrases)",
    `- Server received this request at (UTC): ${serverUtc}`,
  ];
  if (tz.length > 0) lines.push(`- Client IANA timezone: ${tz}`);
  if (wall.length > 0) lines.push(`- Current local wall time in that zone: ${wall}`);
  if (clientIso.length > 0) lines.push(`- Client clock when sending message (ISO): ${clientIso}`);
  lines.push(
    "Interpret \"today\", \"this afternoon\", \"tomorrow\", \"in an hour\", etc. using the client's timezone when provided; otherwise use UTC."
  );
  return lines.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    const messages = body.messages ?? [];
    const tools = buildPhukoAiToolSet();

    const modelMessages = await convertToModelMessages(messages, { tools });

    const dayBlock = await buildChatDayContextBlock(req);

    const result = streamText({
      model: getChatModel(),
      system: `${SYSTEM}\n\n${buildNowContext(req)}\n\n${dayBlock}`,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(24),
      temperature: 0.25,
    });

    return result.toUIMessageStreamResponse();
  } catch (e) {
    const tag = typeof e === "object" && e !== null ? Object.prototype.toString.call(e) : "";
    const msg =
      e instanceof Error
        ? e.message
        : typeof e === "string"
          ? e
          : tag === "[object Event]" || tag === "[object ProgressEvent]"
            ? "Request failed (stream or network)."
            : "Chat failed";
    console.error("[api/chat]", e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
