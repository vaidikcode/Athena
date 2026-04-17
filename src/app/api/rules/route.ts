import { NextRequest, NextResponse } from "next/server";
import { ruleStore } from "@/lib/rules";
import { z } from "zod";

export const runtime = "nodejs";

const CreateRuleSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  priority: z.number().min(1).max(10).optional().default(5),
  enabled: z.boolean().optional().default(true),
  tags: z.array(z.string()).optional().default([]),
  source: z.enum(["user", "agent"]).optional().default("user"),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

export async function GET() {
  const rules = await ruleStore.list();
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateRuleSchema.parse(body);
    const rule = await ruleStore.create(parsed);
    return NextResponse.json(rule, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}
