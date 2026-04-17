import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memory";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scope: string }> }
) {
  const { scope } = await params;

  if (scope === "yesterday") {
    const memory = await memoryStore.getYesterdayDaily();
    return NextResponse.json(memory ?? null);
  }

  if (scope === "hourly") {
    const memories = await memoryStore.getTodayHourly();
    return NextResponse.json(memories);
  }

  if (scope === "daily") {
    const memory = await memoryStore.getTodayDaily();
    return NextResponse.json(memory ?? null);
  }

  return NextResponse.json({ error: `Unknown scope: ${scope}` }, { status: 400 });
}
