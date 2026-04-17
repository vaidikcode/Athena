import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { suggestions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { calendarStore } from "@/lib/calendar/store";
import { ruleStore } from "@/lib/rules";

export const runtime = "nodejs";

const ActionSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

async function applyCalendarSuggestion(
  kind: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (kind === "calendar.create") {
    const { startAt, endAt, ...rest } = payload;
    await calendarStore.create(
      {
        ...(rest as Parameters<typeof calendarStore.create>[0]),
        startAt: new Date(startAt as string),
        endAt: new Date(endAt as string),
        source: "agent",
        type: (rest.type as string) ?? "other",
        energyCost: (rest.energyCost as "low" | "medium" | "high") ?? "medium",
        priority: (rest.priority as number) ?? 5,
        recurrence: null,
      } as Parameters<typeof calendarStore.create>[0],
      "agent"
    );
  } else if (kind === "calendar.delete") {
    const id = payload.id as string;
    if (id) await calendarStore.delete(id, "agent");
  } else if (kind === "calendar.reschedule") {
    const { id, startAt, endAt, ...rest } = payload;
    const patch: Record<string, unknown> = { ...rest };
    if (startAt) patch.startAt = new Date(startAt as string);
    if (endAt) patch.endAt = new Date(endAt as string);
    await calendarStore.update(id as string, patch as Parameters<typeof calendarStore.update>[1], "agent");
  } else if (kind === "rule.add") {
    await ruleStore.create({
      title: (payload.title as string) ?? "Agent rule",
      body: (payload.body as string) ?? "",
      priority: (payload.priority as number) ?? 5,
      tags: (payload.tags as string[]) ?? [],
      source: "agent",
      confidence: payload.confidence as number | undefined,
    });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { action } = ActionSchema.parse(body);

    // Load the suggestion
    const rows = await db.select().from(suggestions).where(eq(suggestions.id, id)).limit(1);
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const suggestion = rows[0];

    let newStatus: "accepted" | "rejected" | "applied" = action === "reject" ? "rejected" : "accepted";

    if (action === "accept") {
      // Try to apply it
      try {
        await applyCalendarSuggestion(suggestion.kind, suggestion.payload as Record<string, unknown>);
        newStatus = "applied";
      } catch (err) {
        console.error(`[suggestions] Failed to apply ${suggestion.kind}:`, err);
        // Still mark accepted even if apply fails, don't block UX
        newStatus = "accepted";
      }
    }

    await db.update(suggestions).set({ status: newStatus }).where(eq(suggestions.id, id));

    const updated = await db.select().from(suggestions).where(eq(suggestions.id, id)).limit(1);
    return NextResponse.json(updated[0]);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(suggestions)
    .where(eq(suggestions.id, id))
    .limit(1);
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
