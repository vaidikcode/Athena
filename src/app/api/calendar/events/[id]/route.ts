import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calendarStore } from "@/lib/calendar/store";

const patchSchema = z.object({
  title: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  type: z.enum(["deep_work", "meeting", "admin", "personal", "health", "learning", "social", "other"]).optional(),
  energyCost: z.enum(["low", "medium", "high"]).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional().nullable(),
  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
  justification: z.string().optional().nullable(),
  linkedRuleId: z.string().optional().nullable(),
  attendees: z.array(z.string()).optional(),
  allDay: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await calendarStore.get(id);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
  }

  const { startAt, endAt, ...rest } = parsed.data;
  const patch: Record<string, unknown> = { ...rest };
  if (startAt) patch.startAt = new Date(startAt);
  if (endAt) patch.endAt = new Date(endAt);

  try {
    const event = await calendarStore.update(id, patch as Parameters<typeof calendarStore.update>[1], "user");
    return NextResponse.json(event);
  } catch (err) {
    const msg = String(err);
    if (msg.includes("not found")) return NextResponse.json({ error: msg }, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await calendarStore.delete(id, "user");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
