import { after } from "next/server";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { runs } from "@/lib/db";

export const runtime = "nodejs";
/** Agent can exceed default serverless limits; raise on Vercel plan that supports it. */
export const maxDuration = 300;

const DEFAULT_COOLDOWN_MS = 45 * 60 * 1000;

function visitJobsDisabled(): boolean {
  return process.env.VISIT_JOBS_ENABLED === "false";
}

function cooldownMs(): number {
  const raw = process.env.VISIT_JOB_COOLDOWN_MS?.trim();
  if (!raw) return DEFAULT_COOLDOWN_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 60_000 ? n : DEFAULT_COOLDOWN_MS;
}

export async function POST() {
  if (visitJobsDisabled()) {
    return new NextResponse(null, { status: 204 });
  }

  const ms = cooldownMs();
  const latest = await db
    .select({ startedAt: runs.startedAt })
    .from(runs)
    .where(eq(runs.kind, "hourly"))
    .orderBy(desc(runs.startedAt))
    .limit(1);

  const lastStart = latest[0]?.startedAt;
  if (lastStart instanceof Date && Date.now() - lastStart.getTime() < ms) {
    return NextResponse.json(
      { ok: true, scheduled: false, reason: "cooldown" },
      { status: 202 }
    );
  }

  after(async () => {
    try {
      const { runHourly } = await import("@/lib/agent/runner");
      await runHourly();
    } catch (err) {
      console.error("[api/jobs/visit] runHourly failed:", err);
    }
  });

  return NextResponse.json({ ok: true, scheduled: true }, { status: 202 });
}
