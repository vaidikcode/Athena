import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { suggestions } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const rows = status
    ? await db
        .select()
        .from(suggestions)
        .where(eq(suggestions.status, status as "pending" | "accepted" | "rejected" | "applied"))
        .orderBy(desc(suggestions.createdAt))
        .limit(limit)
    : await db
        .select()
        .from(suggestions)
        .orderBy(desc(suggestions.createdAt))
        .limit(limit);

  return NextResponse.json(rows);
}
