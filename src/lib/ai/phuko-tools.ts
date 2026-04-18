import "server-only";
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import type { StructuredTool } from "@langchain/core/tools";
import type { ZodTypeAny } from "zod";
import { buildToolRegistry } from "@/lib/tools/registry";
import { calendarStore } from "@/lib/calendar/store";

/**
 * Tools that require human-in-the-loop confirmation in the Console UI.
 * These are registered WITHOUT an `execute` function so the AI SDK marks
 * their state as "input-available" and the client widget resolves them via
 * addToolResult() before the stream resumes.
 */
const HITL_TOOLS = new Set(["create_rule", "update_event", "delete_event"]);

/**
 * Wrap LangChain StructuredTools as AI SDK tools so `streamText` + `useChat`
 * get first-class tool-call / tool-result streaming in the UI.
 */
export function buildAthenaToolSet(): ToolSet {
  const registry = buildToolRegistry();
  const out: ToolSet = {};

  for (const t of registry) {
    const st = t as StructuredTool & { schema?: ZodTypeAny };
    const name = st.name;
    const schema = st.schema;
    if (!name || !schema) continue;

    if (HITL_TOOLS.has(name)) {
      // HITL: no execute — the AI SDK will pause at input-available state;
      // the Console widget resolves it via addToolResult().
      out[name] = tool({
        description: st.description,
        inputSchema: schema,
      });
    } else {
      out[name] = tool({
        description: st.description,
        inputSchema: schema,
        execute: async (input) => {
          try {
            const raw = await st.invoke(input as never);
            if (typeof raw === "string") return raw;
            try {
              return JSON.stringify(raw);
            } catch {
              return String(raw);
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return JSON.stringify({ error: msg, tool: name });
          }
        },
      });
    }
  }

  // ── Display-only tools ────────────────────────────────────────────────────
  // These are pure read tools that return UI-optimised payloads and trigger
  // specific widgets (DayTimeline, LoadChart, SlotPicker) in the Console.

  out["render_day_timeline"] = tool({
    description:
      "Render today's or a given date's events as a compact timeline widget for the Console. Call this when the user asks about their schedule for a day, wants to see what's on, or when you want to show events rather than list them in prose.",
    inputSchema: z.object({
      date: z
        .string()
        .optional()
        .describe(
          "ISO date string YYYY-MM-DD. Defaults to today if omitted."
        ),
    }),
    execute: async ({ date }) => {
      const target = date ? new Date(date + "T00:00:00") : new Date();
      target.setHours(0, 0, 0, 0);
      const end = new Date(target);
      end.setHours(23, 59, 59, 999);
      try {
        const events = await calendarStore.list({ from: target, to: end });
        return JSON.stringify({ date: target.toISOString().slice(0, 10), events });
      } catch {
        return JSON.stringify({ error: "Could not load events" });
      }
    },
  });

  out["render_load"] = tool({
    description:
      "Render a load summary chart for today or a given date showing minutes by event type, back-to-back meetings, and high-priority event count. Call this when analysing workload, burnout risk, or schedule density.",
    inputSchema: z.object({
      date: z
        .string()
        .optional()
        .describe("ISO date string YYYY-MM-DD. Defaults to today."),
    }),
    execute: async ({ date }) => {
      const target = date ? new Date(date + "T00:00:00") : new Date();
      target.setHours(0, 0, 0, 0);
      const end = new Date(target);
      end.setHours(23, 59, 59, 999);
      try {
        const load = await calendarStore.summarizeLoad(target, end);
        return JSON.stringify({ date: target.toISOString().slice(0, 10), ...load });
      } catch {
        return JSON.stringify({ error: "Could not compute load" });
      }
    },
  });

  out["propose_slots"] = tool({
    description:
      "Suggest free time slots for rescheduling or adding an event. Returns ranked candidates the user can tap in the SlotPicker widget. Call this when the user asks to reschedule an event or find time for something, or after detecting a conflict that needs a move.",
    inputSchema: z.object({
      eventId: z.string().optional().describe("ID of the event to reschedule, if any."),
      eventTitle: z.string().optional().describe("Title of the event being rescheduled (for display)."),
      durationMin: z.number().describe("Required duration in minutes."),
      date: z
        .string()
        .optional()
        .describe(
          "ISO date YYYY-MM-DD to search within. Defaults to today."
        ),
      windowStartHour: z
        .number()
        .optional()
        .default(8)
        .describe("Earliest hour to consider (0-23)."),
      windowEndHour: z
        .number()
        .optional()
        .default(21)
        .describe("Latest end hour to consider (0-23)."),
    }),
    execute: async ({ eventId, eventTitle, durationMin, date, windowStartHour = 8, windowEndHour = 21 }) => {
      const target = date ? new Date(date + "T00:00:00") : new Date();
      target.setHours(0, 0, 0, 0);
      const winEnd = new Date(target);
      winEnd.setHours(23, 59, 59, 999);

      try {
        const events = await calendarStore.list({ from: target, to: winEnd });
        const busy = events
          .filter((e) => e.status !== "cancelled")
          .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

        const candidates: Array<{ startIso: string; endIso: string; score: number; reason: string }> = [];
        const durMs = durationMin * 60_000;

        const dayStart = new Date(target);
        dayStart.setHours(windowStartHour, 0, 0, 0);
        const dayEnd = new Date(target);
        dayEnd.setHours(windowEndHour, 0, 0, 0);

        // Walk through gaps
        let cursor = dayStart.getTime();
        for (const ev of busy) {
          const evStart = ev.startAt.getTime();
          const evEnd = ev.endAt.getTime();
          if (evStart > cursor + durMs && cursor + durMs <= dayEnd.getTime()) {
            candidates.push({
              startIso: new Date(cursor).toISOString(),
              endIso: new Date(cursor + durMs).toISOString(),
              score: 80,
              reason: "Free slot before next event",
            });
          }
          if (evEnd > cursor) cursor = evEnd;
          if (candidates.length >= 4) break;
        }
        // After last event
        if (candidates.length < 4 && cursor + durMs <= dayEnd.getTime()) {
          candidates.push({
            startIso: new Date(cursor).toISOString(),
            endIso: new Date(cursor + durMs).toISOString(),
            score: 70,
            reason: "Open time after all events",
          });
        }

        return JSON.stringify({ eventId: eventId ?? null, eventTitle: eventTitle ?? null, candidates });
      } catch {
        return JSON.stringify({ error: "Could not compute slots" });
      }
    },
  });

  return out;
}
