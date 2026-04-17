import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { calendarStore } from "./store";
import type { RecurrenceRule } from "@/lib/db/schema";

// ── Shared sub-schemas ─────────────────────────────────────────────────────
const recurrenceSchema = z
  .object({
    freq: z.enum(["daily", "weekly", "monthly"]),
    interval: z.number().int().positive().optional(),
    byday: z.array(z.string()).optional(),
    until: z.string().optional(),
    count: z.number().int().positive().optional(),
  })
  .optional()
  .nullable();

const eventTypeEnum = z.enum(["deep_work", "meeting", "admin", "personal", "health", "learning", "social", "other"]);
const energyCostEnum = z.enum(["low", "medium", "high"]);
const statusEnum = z.enum(["confirmed", "tentative", "cancelled"]);

// ── list_events ───────────────────────────────────────────────────────────
class ListEventsTool extends StructuredTool {
  name = "list_events";
  description =
    "List calendar events in a date/time window. Returns expanded recurrence instances. Excludes cancelled events unless status filter includes 'cancelled'.";

  schema = z.object({
    from: z.string().describe("ISO8601 start of window"),
    to: z.string().describe("ISO8601 end of window"),
    status: z.array(statusEnum).optional().describe("Filter by status"),
    type: z.array(eventTypeEnum).optional().describe("Filter by event type"),
  });

  async _call({ from, to, status, type }: z.infer<typeof this.schema>) {
    const events = await calendarStore.list({
      from: new Date(from),
      to: new Date(to),
      status: status as Array<"confirmed" | "tentative" | "cancelled"> | undefined,
      type: type as Array<"deep_work" | "meeting" | "admin" | "personal" | "health" | "learning" | "social" | "other"> | undefined,
    });
    return JSON.stringify(events);
  }
}

// ── get_event ─────────────────────────────────────────────────────────────
class GetEventTool extends StructuredTool {
  name = "get_event";
  description = "Get a single calendar event by ID.";

  schema = z.object({
    id: z.string().describe("Event ID"),
  });

  async _call({ id }: z.infer<typeof this.schema>) {
    const event = await calendarStore.get(id);
    if (!event) return JSON.stringify({ error: `Event ${id} not found` });
    return JSON.stringify(event);
  }
}

// ── create_event ──────────────────────────────────────────────────────────
class CreateEventTool extends StructuredTool {
  name = "create_event";
  description =
    "Create a new calendar event. Use type, energyCost, priority to help the agent reason about workload and bottlenecks.";

  schema = z.object({
    title: z.string(),
    startAt: z.string().describe("ISO8601"),
    endAt: z.string().describe("ISO8601"),
    description: z.string().optional(),
    location: z.string().optional(),
    type: eventTypeEnum.optional(),
    energyCost: energyCostEnum.optional(),
    priority: z.number().int().min(1).max(10).optional(),
    tags: z.array(z.string()).optional(),
    allDay: z.boolean().optional(),
    color: z.string().optional(),
    recurrence: recurrenceSchema,
    justification: z.string().optional().describe("Why this event exists"),
    linkedRuleId: z.string().optional(),
    attendees: z.array(z.string()).optional(),
  });

  async _call(input: z.infer<typeof this.schema>) {
    const event = await calendarStore.create(
      {
        ...input,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        source: "agent",
        recurrence: (input.recurrence as RecurrenceRule) ?? null,
        type: input.type ?? "other",
        energyCost: input.energyCost ?? "medium",
        priority: input.priority ?? 5,
      },
      "agent"
    );
    return JSON.stringify(event);
  }
}

// ── update_event ──────────────────────────────────────────────────────────
class UpdateEventTool extends StructuredTool {
  name = "update_event";
  description = "Update fields on an existing calendar event.";

  schema = z.object({
    id: z.string(),
    title: z.string().optional(),
    startAt: z.string().optional().describe("ISO8601"),
    endAt: z.string().optional().describe("ISO8601"),
    description: z.string().optional(),
    location: z.string().optional(),
    type: eventTypeEnum.optional(),
    energyCost: energyCostEnum.optional(),
    priority: z.number().int().min(1).max(10).optional(),
    tags: z.array(z.string()).optional(),
    color: z.string().optional(),
    status: statusEnum.optional(),
    recurrence: recurrenceSchema,
    justification: z.string().optional(),
    linkedRuleId: z.string().optional(),
    attendees: z.array(z.string()).optional(),
  });

  async _call({ id, startAt, endAt, recurrence, ...rest }: z.infer<typeof this.schema>) {
    const patch: Record<string, unknown> = { ...rest };
    if (startAt) patch.startAt = new Date(startAt);
    if (endAt) patch.endAt = new Date(endAt);
    if (recurrence !== undefined) patch.recurrence = recurrence as RecurrenceRule | null;

    const event = await calendarStore.update(id, patch as Parameters<typeof calendarStore.update>[1], "agent");
    return JSON.stringify(event);
  }
}

// ── delete_event ──────────────────────────────────────────────────────────
class DeleteEventTool extends StructuredTool {
  name = "delete_event";
  description = "Soft-delete (cancel) a calendar event by ID.";

  schema = z.object({
    id: z.string(),
  });

  async _call({ id }: z.infer<typeof this.schema>) {
    await calendarStore.delete(id, "agent");
    return JSON.stringify({ success: true, id });
  }
}

// ── complete_event ────────────────────────────────────────────────────────
class CompleteEventTool extends StructuredTool {
  name = "complete_event";
  description = "Mark an event as completed, optionally recording actual timings and outcome notes.";

  schema = z.object({
    id: z.string(),
    outcomeNotes: z.string().optional(),
    actualStartAt: z.string().optional().describe("ISO8601 actual start"),
    actualEndAt: z.string().optional().describe("ISO8601 actual end"),
  });

  async _call({ id, outcomeNotes, actualStartAt, actualEndAt }: z.infer<typeof this.schema>) {
    const event = await calendarStore.complete(
      id,
      {
        outcomeNotes,
        actualStartAt: actualStartAt ? new Date(actualStartAt) : undefined,
        actualEndAt: actualEndAt ? new Date(actualEndAt) : undefined,
      },
      "agent"
    );
    return JSON.stringify(event);
  }
}

// ── annotate_event ────────────────────────────────────────────────────────
class AnnotateEventTool extends StructuredTool {
  name = "annotate_event";
  description = "Append a note / post-hoc observation to an event's outcome notes and write a log entry.";

  schema = z.object({
    id: z.string(),
    note: z.string(),
  });

  async _call({ id, note }: z.infer<typeof this.schema>) {
    const event = await calendarStore.annotate(id, note, "agent");
    return JSON.stringify(event);
  }
}

// ── list_event_logs ───────────────────────────────────────────────────────
class ListEventLogsTool extends StructuredTool {
  name = "list_event_logs";
  description = "Return the full history log for a calendar event, useful for reasoning about repeated cancellations or rescheduling.";

  schema = z.object({
    eventId: z.string(),
  });

  async _call({ eventId }: z.infer<typeof this.schema>) {
    const logs = await calendarStore.listLogs(eventId);
    return JSON.stringify(logs);
  }
}

// ── find_conflicts ────────────────────────────────────────────────────────
class FindConflictsTool extends StructuredTool {
  name = "find_conflicts";
  description = "Find overlapping event pairs within a window. Returns pairs of conflicting events to help detect bottlenecks.";

  schema = z.object({
    windowStart: z.string().describe("ISO8601"),
    windowEnd: z.string().describe("ISO8601"),
  });

  async _call({ windowStart, windowEnd }: z.infer<typeof this.schema>) {
    const pairs = await calendarStore.findConflicts(new Date(windowStart), new Date(windowEnd));
    return JSON.stringify(pairs);
  }
}

// ── summarize_load ────────────────────────────────────────────────────────
class SummarizeLoadTool extends StructuredTool {
  name = "summarize_load";
  description =
    "Aggregate total minutes per type, per energyCost, count of high-priority events, and back-to-back transitions in a window. Cheap load snapshot for bottleneck detection.";

  schema = z.object({
    from: z.string().describe("ISO8601"),
    to: z.string().describe("ISO8601"),
  });

  async _call({ from, to }: z.infer<typeof this.schema>) {
    const summary = await calendarStore.summarizeLoad(new Date(from), new Date(to));
    return JSON.stringify(summary);
  }
}

// ── Export all ────────────────────────────────────────────────────────────
export const calendarTools: StructuredTool[] = [
  new ListEventsTool(),
  new GetEventTool(),
  new CreateEventTool(),
  new UpdateEventTool(),
  new DeleteEventTool(),
  new CompleteEventTool(),
  new AnnotateEventTool(),
  new ListEventLogsTool(),
  new FindConflictsTool(),
  new SummarizeLoadTool(),
];
