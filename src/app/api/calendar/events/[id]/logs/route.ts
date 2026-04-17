import { NextRequest, NextResponse } from "next/server";
import { calendarStore } from "@/lib/calendar/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const logs = await calendarStore.listLogs(id);
    return NextResponse.json(logs);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
