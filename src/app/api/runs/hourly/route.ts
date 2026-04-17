import { NextResponse } from "next/server";
import { runHourly } from "@/lib/agent/runner";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await runHourly();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/runs/hourly]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}
