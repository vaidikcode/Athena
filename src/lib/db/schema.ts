import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ── Calendar types ─────────────────────────────────────────────────────────
export type EventType = "deep_work" | "meeting" | "admin" | "personal" | "health" | "learning" | "social" | "other";
export type EventStatus = "confirmed" | "tentative" | "cancelled";
export type EnergyCost = "low" | "medium" | "high";
export type RecurrenceRule = {
  freq: "daily" | "weekly" | "monthly";
  interval?: number;
  byday?: string[];
  until?: string;
  count?: number;
};

export const memories = sqliteTable("memories", {
  id: text("id").primaryKey(),
  scope: text("scope", { enum: ["hourly", "daily"] }).notNull(),
  windowStart: integer("window_start", { mode: "timestamp" }).notNull(),
  windowEnd: integer("window_end", { mode: "timestamp" }).notNull(),
  summary: text("summary").notNull(),
  events: text("events", { mode: "json" }).notNull().$type<Record<string, unknown>[]>(),
  runId: text("run_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const rules = sqliteTable("rules", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  priority: integer("priority").notNull().default(5),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  tags: text("tags", { mode: "json" }).notNull().$type<string[]>().default([]),
  source: text("source", { enum: ["user", "agent"] }).notNull().default("user"),
  confidence: real("confidence"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const runs = sqliteTable("runs", {
  id: text("id").primaryKey(),
  kind: text("kind", { enum: ["hourly", "daily"] }).notNull(),
  status: text("status", { enum: ["running", "success", "error"] }).notNull().default("running"),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  transcript: text("transcript", { mode: "json" }).$type<Record<string, unknown>[]>().default([]),
  toolCalls: text("tool_calls", { mode: "json" }).$type<Record<string, unknown>[]>().default([]),
  error: text("error"),
});

export const suggestions = sqliteTable("suggestions", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  kind: text("kind", {
    enum: ["calendar.create", "calendar.delete", "calendar.reschedule", "rule.add"],
  }).notNull(),
  payload: text("payload", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
  status: text("status", {
    enum: ["pending", "accepted", "rejected", "applied"],
  })
    .notNull()
    .default("pending"),
  autoApply: integer("auto_apply", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey(),
  // Identity
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  source: text("source", { enum: ["user", "agent"] }).notNull().default("user"),
  // Google-parity
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startAt: integer("start_at", { mode: "timestamp" }).notNull(),
  endAt: integer("end_at", { mode: "timestamp" }).notNull(),
  allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
  timezone: text("timezone").default("local"),
  color: text("color"),
  status: text("status", { enum: ["confirmed", "tentative", "cancelled"] }).notNull().default("confirmed"),
  attendees: text("attendees", { mode: "json" }).$type<string[]>().default([]),
  recurrence: text("recurrence", { mode: "json" }).$type<RecurrenceRule | null>(),
  recurrenceParentId: text("recurrence_parent_id"),
  externalId: text("external_id"),
  // Leverage fields
  type: text("type", { enum: ["deep_work", "meeting", "admin", "personal", "health", "learning", "social", "other"] }).notNull().default("other"),
  energyCost: text("energy_cost", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  priority: integer("priority").notNull().default(5),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  linkedRuleId: text("linked_rule_id"),
  justification: text("justification"),
  // Plan vs actual
  actualStartAt: integer("actual_start_at", { mode: "timestamp" }),
  actualEndAt: integer("actual_end_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  outcomeNotes: text("outcome_notes"),
});

export const calendarEventLogs = sqliteTable("calendar_event_logs", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  at: integer("at", { mode: "timestamp" }).notNull(),
  action: text("action", { enum: ["created", "updated", "completed", "cancelled", "rescheduled", "annotated"] }).notNull(),
  actor: text("actor", { enum: ["user", "agent"] }).notNull().default("user"),
  diff: text("diff", { mode: "json" }).$type<Record<string, unknown>>(),
  note: text("note"),
});

export type Memory = typeof memories.$inferSelect;
export type Rule = typeof rules.$inferSelect;
export type Run = typeof runs.$inferSelect;
export type Suggestion = typeof suggestions.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
export type NewRule = typeof rules.$inferInsert;
export type NewRun = typeof runs.$inferInsert;
export type NewSuggestion = typeof suggestions.$inferInsert;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
export type CalendarEventLog = typeof calendarEventLogs.$inferSelect;
export type NewCalendarEventLog = typeof calendarEventLogs.$inferInsert;
