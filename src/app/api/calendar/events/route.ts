import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calendarStore } from "@/lib/calendar/store";
import { normalizeEventRange } from "@/lib/calendar/interpret-date";
import type { EventStatus, EventType } from "@/lib/db/schema";

const createSchema = z.object({
  title: z.string().min(1),
  startAt: z.string(),
  endAt: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(["deep_work", "meeting", "admin", "personal", "health", "learning", "social", "other"]).optional(),
  energyCost: z.enum(["low", "medium", "high"]).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  tags: z.array(z.string()).optional(),
  allDay: z.boolean().optional(),
  color: z.string().optional(),
  recurrence: z.object({
    freq: z.enum(["daily", "weekly", "monthly"]),
    interval: z.number().optional(),
    byday: z.array(z.string()).optional(),
    until: z.string().optional(),
    count: z.number().optional(),
  }).optional().nullable(),
  justification: z.string().optional(),
  linkedRuleId: z.string().optional(),
  attendees: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "from and to must be valid ISO date strings" }, { status: 400 });
  }

  const statusParam = searchParams.get("status");
  const typeParam = searchParams.get("type");

  const status = statusParam ? (statusParam.split(",") as EventStatus[]) : undefined;
  const type = typeParam ? (typeParam.split(",") as EventType[]) : undefined;

  try {
    const events = await calendarStore.list({
      from: fromDate,
      to: toDate,
      status,
      type,
    });
    // #region agent log
    fetch("http://127.0.0.1:7591/ingest/73c4b017-15bb-4995-8b45-c03b8545c6c9", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "218496" },
      body: JSON.stringify({
        sessionId: "218496",
        hypothesisId: "H4",
        location: "api/calendar/events/route.ts:GET",
        message: "list returned",
        data: {
          count: events.length,
          fromMs: fromDate.getTime(),
          toMs: toDate.getTime(),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json(events);
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7591/ingest/73c4b017-15bb-4995-8b45-c03b8545c6c9", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "218496" },
      body: JSON.stringify({
        sessionId: "218496",
        hypothesisId: "H4",
        location: "api/calendar/events/route.ts:GET",
        message: "list catch",
        data: { err: String(err).slice(0, 300) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
  }

  const { startAt: startStr, endAt: endStr, ...rest } = parsed.data;
  const { startAt, endAt } = normalizeEventRange(startStr, endStr);
  try {
    const event = await calendarStore.create(
      {
        ...rest,
        startAt,
        endAt,
        source: "user",
        type: rest.type ?? "other",
        energyCost: rest.energyCost ?? "medium",
        priority: rest.priority ?? 5,
        recurrence: rest.recurrence ?? null,
      },
      "user"
    );
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
