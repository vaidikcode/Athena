import { NextRequest, NextResponse } from "next/server";
import { ruleStore } from "@/lib/rules";
import { z } from "zod";

export const runtime = "nodejs";

const PatchRuleSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  priority: z.number().min(1).max(10).optional(),
  enabled: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rule = await ruleStore.get(id);
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rule);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const patch = PatchRuleSchema.parse(body);
    const rule = await ruleStore.update(id, patch);
    if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rule);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await ruleStore.delete(id);
  return NextResponse.json({ deleted: id });
}
