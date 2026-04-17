import { NextResponse } from "next/server";
import { runDaily } from "@/lib/agent/runner";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await runDaily();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/runs/daily]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}
