import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { rules, type Rule, type NewRule } from "@/lib/db";
export class RuleStore {
  async list(): Promise<Rule[]> {
    return db.select().from(rules).orderBy(desc(rules.priority), desc(rules.createdAt));
  }

  async listEnabled(): Promise<Rule[]> {
    return db
      .select()
      .from(rules)
      .where(eq(rules.enabled, true))
      .orderBy(desc(rules.priority));
  }

  async get(id: string): Promise<Rule | undefined> {
    const rows = await db.select().from(rules).where(eq(rules.id, id)).limit(1);
    return rows[0];
  }

  async create(
    input: Omit<NewRule, "id" | "createdAt" | "updatedAt">
  ): Promise<Rule> {
    const now = new Date();
    const row: NewRule = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(rules).values(row);
    return (await this.get(row.id))!;
  }

  async update(id: string, patch: Partial<Omit<NewRule, "id" | "createdAt">>): Promise<Rule | undefined> {
    await db
      .update(rules)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(rules.id, id));
    return this.get(id);
  }

  async delete(id: string): Promise<void> {
    await db.delete(rules).where(eq(rules.id, id));
  }
}

export const ruleStore = new RuleStore();
