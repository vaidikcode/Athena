import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { runs } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") as "hourly" | "daily" | null;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  const query = db
    .select()
    .from(runs)
    .orderBy(desc(runs.startedAt))
    .limit(limit);

  const rows = kind
    ? await db.select().from(runs).where(eq(runs.kind, kind)).orderBy(desc(runs.startedAt)).limit(limit)
    : await query;

  return NextResponse.json(rows);
}
