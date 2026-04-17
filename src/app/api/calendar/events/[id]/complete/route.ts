import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calendarStore } from "@/lib/calendar/store";

const schema = z.object({
  outcomeNotes: z.string().optional(),
  actualStartAt: z.string().optional(),
  actualEndAt: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown = {};
  try {
    body = await req.json();
  } catch { /* empty body ok */ }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
  }

  const { outcomeNotes, actualStartAt, actualEndAt } = parsed.data;
  try {
    const event = await calendarStore.complete(
      id,
      {
        outcomeNotes,
        actualStartAt: actualStartAt ? new Date(actualStartAt) : undefined,
        actualEndAt: actualEndAt ? new Date(actualEndAt) : undefined,
      },
      "user"
    );
    return NextResponse.json(event);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
