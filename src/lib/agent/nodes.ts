import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { StructuredTool } from "@langchain/core/tools";
import type { AgentState } from "./state";
import { memoryStore } from "@/lib/memory";
import { ruleStore } from "@/lib/rules";
import { collectorTools } from "@/lib/tools/collectors";
import { calendarStore } from "@/lib/calendar/store";

// ── loadContext ──────────────────────────────────────────────────────────────

export async function loadContext(state: AgentState): Promise<Partial<AgentState>> {
  const [rules, priorDaily, lastHourly] = await Promise.all([
    ruleStore.listEnabled(),
    memoryStore.getYesterdayDaily(),
    memoryStore.getLastHourly(),
  ]);

  // Attach event logs for events in the current window so the agent can detect
  // patterns like repeated cancellations without having to call list_event_logs manually
  const windowEvents = await calendarStore.list({
    from: state.windowStart,
    to: state.windowEnd,
    status: ["confirmed", "tentative", "cancelled"],
  });

  const eventLogsMap: Record<string, unknown[]> = {};
  await Promise.all(
    windowEvents.slice(0, 20).map(async (ev) => {
      try {
        const logs = await calendarStore.listLogs(ev.recurrenceParentId ?? ev.id);
        if (logs.length > 0) eventLogsMap[ev.id] = logs;
      } catch { /* skip */ }
    })
  );

  // Merge into collected so the system prompt can reference it
  const collected = {
    ...(state.collected ?? {}),
    event_logs_for_window: eventLogsMap,
  };

  return { rules, priorDaily: priorDaily ?? null, lastHourly: lastHourly ?? null, collected };
}

// ── collect ──────────────────────────────────────────────────────────────────

export async function collect(state: AgentState): Promise<Partial<AgentState>> {
  const windowStart = state.windowStart.toISOString();
  const windowEnd = state.windowEnd.toISOString();

  const results: Record<string, unknown> = {};

  for (const t of collectorTools) {
    try {
      const raw = await t.invoke({ windowStart, windowEnd });
      results[t.name] = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (err) {
      results[t.name] = { error: String(err) };
    }
  }

  // Pre-warm the load snapshot so it's available in the system prompt
  try {
    const loadSnapshot = await calendarStore.summarizeLoad(state.windowStart, state.windowEnd);
    results["load_snapshot"] = loadSnapshot;
  } catch {
    results["load_snapshot"] = { error: "unavailable" };
  }

  return { collected: results };
}

// ── buildSystemPrompt ─────────────────────────────────────────────────────────

export function buildSystemPrompt(state: AgentState): string {
  const rulesText =
    state.rules.length === 0
      ? "No active rules yet."
      : state.rules
          .map((r) => `[Priority ${r.priority}] ${r.title}: ${r.body}`)
          .join("\n");

  const priorDailyText = state.priorDaily
    ? `Yesterday's daily summary: ${state.priorDaily.summary}`
    : "No prior daily memory available.";

  const lastHourlyText = state.lastHourly
    ? `Last hourly summary: ${state.lastHourly.summary}`
    : "No prior hourly memory available.";

  const loadSnapshot = state.collected?.["load_snapshot"];
  const loadSnapshotText = loadSnapshot
    ? `\`\`\`json\n${JSON.stringify(loadSnapshot, null, 2)}\n\`\`\``
    : "No load snapshot available.";

  const collectedText = JSON.stringify(
    Object.fromEntries(Object.entries(state.collected ?? {}).filter(([k]) => k !== "load_snapshot")),
    null,
    2
  );

  return `You are Phuko, an AI life-operating system. You help the user understand the hidden architecture of their day and suggest leverage points to improve it.

Window: ${state.windowStart.toISOString()} → ${state.windowEnd.toISOString()} (kind: ${state.kind})

## Context
${priorDailyText}
${lastHourlyText}

## Active Rules
${rulesText}

## Load Snapshot (this window)
${loadSnapshotText}

## Collected Data (this window)
\`\`\`json
${collectedText}
\`\`\`

## Known Bottleneck Signals — actively look for these
- **Back-to-back high-energy events**: back_to_back_count > 2 with high energyCost meetings is a burnout signal.
- **High-priority work after poor sleep**: health stats show < 6h sleep AND priority ≥ 8 deep_work blocks upcoming.
- **Deep-work blocks repeatedly cancelled or rescheduled**: check event logs via \`list_event_logs\` for pattern.
- **Meeting overload**: totalMinutesByType.meeting > 240 min/day crowds out deep work.
- **No recovery time**: no personal/health events in a > 4h stretch of confirmed events.
- **Rule violations**: active rules not reflected in scheduled events (e.g., rule says "family time 6-7pm" but a meeting is there).
- **Conflicting events**: use \`find_conflicts\` to surface overlaps and decide which to keep.

## Your Job
1. Analyse the collected data and load snapshot — look for the bottleneck signals above.
2. Compare against active rules. Flag violations explicitly.
3. Suggest 1-3 concrete actions. Use tools to act:
   - \`create_event\` / \`update_event\` / \`delete_event\` for calendar mutations.
   - \`complete_event\` / \`annotate_event\` to record outcomes.
   - \`find_conflicts\` to detect overlaps.
   - \`create_rule\` / \`list_rules\` for rule CRUD.
4. Produce a short summary (2-3 sentences) for the next context window.

Be concise, specific, action-oriented. Ground every suggestion in the actual data above. Avoid generic productivity advice.`;
}

// ── buildReason (factory — needs tools bound) ─────────────────────────────────

export function makeReasonNode(tools: StructuredTool[], getLLM: () => import("@langchain/core/language_models/chat_models").BaseChatModel) {
  return async function reason(state: AgentState): Promise<Partial<AgentState>> {
    const baseModel = getLLM();
    const model = (baseModel as typeof baseModel & { bindTools: (t: StructuredTool[]) => typeof baseModel }).bindTools(tools);

    const systemMsg = new SystemMessage(buildSystemPrompt(state));

    const userMsg = new HumanMessage(
      `Analyse the ${state.kind} window from ${state.windowStart.toISOString()} to ${state.windowEnd.toISOString()} and take appropriate actions.`
    );

    const existingMessages = state.messages ?? [];
    const newMessages = existingMessages.length === 0
      ? [systemMsg, userMsg]
      : existingMessages;

    const response = await model.invoke(newMessages);
    return { messages: [...newMessages, response] };
  };
}

// ── propose ───────────────────────────────────────────────────────────────────

export async function propose(state: AgentState): Promise<Partial<AgentState>> {
  // Extract tool calls from messages and convert calendar mutations to Suggestion proposals
  const proposals: AgentState["proposals"] = [];

  for (const msg of state.messages) {
    const toolCalls = (msg as { tool_calls?: Array<{ name: string; args: Record<string, unknown>; id?: string }> }).tool_calls;
    if (!toolCalls) continue;

    for (const tc of toolCalls) {
      const name = tc.name as string;
      if (name === "create_event") {
        proposals.push({
          runId: state.runId,
          kind: "calendar.create",
          payload: tc.args as Record<string, unknown>,
          status: "pending",
          autoApply: false,
        });
      } else if (name === "delete_event") {
        proposals.push({
          runId: state.runId,
          kind: "calendar.delete",
          payload: tc.args as Record<string, unknown>,
          status: "pending",
          autoApply: false,
        });
      } else if (name === "update_event") {
        proposals.push({
          runId: state.runId,
          kind: "calendar.reschedule",
          payload: tc.args as Record<string, unknown>,
          status: "pending",
          autoApply: false,
        });
      } else if (name === "create_rule") {
        proposals.push({
          runId: state.runId,
          kind: "rule.add",
          payload: tc.args as Record<string, unknown>,
          status: "pending",
          autoApply: false,
        });
      }
    }
  }

  return { proposals };
}

// ── summarize ─────────────────────────────────────────────────────────────────

export async function summarize(state: AgentState): Promise<Partial<AgentState>> {
  const lastMsg = state.messages.length > 0 ? state.messages[state.messages.length - 1] : null;
  const content = lastMsg
    ? typeof lastMsg.content === "string"
      ? lastMsg.content
      : JSON.stringify(lastMsg.content)
    : "";

  // Extract a clean summary — take first 400 chars of the final AI message
  const summary = content.slice(0, 400).trim() || `${state.kind} analysis complete.`;
  return { summary };
}
