import "server-only";

import { eq, and, gte, lt, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { memories, type Memory, type NewMemory } from "@/lib/db";
export class MemoryStore {
  async save(input: Omit<NewMemory, "id" | "createdAt">): Promise<Memory> {
    const row: NewMemory = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date(),
    };
    await db.insert(memories).values(row);
    return (await this.getById(row.id))!;
  }

  async getById(id: string): Promise<Memory | undefined> {
    const rows = await db
      .select()
      .from(memories)
      .where(eq(memories.id, id))
      .limit(1);
    return rows[0];
  }

  async getLastHourly(): Promise<Memory | undefined> {
    const rows = await db
      .select()
      .from(memories)
      .where(eq(memories.scope, "hourly"))
      .orderBy(desc(memories.windowStart))
      .limit(1);
    return rows[0];
  }

  async getTodayDaily(): Promise<Memory | undefined> {
    const todayStart = startOfDay(new Date());
    const rows = await db
      .select()
      .from(memories)
      .where(and(eq(memories.scope, "daily"), gte(memories.windowStart, todayStart)))
      .orderBy(desc(memories.windowStart))
      .limit(1);
    return rows[0];
  }

  async getYesterdayDaily(): Promise<Memory | undefined> {
    const yesterdayStart = startOfDay(daysAgo(1));
    const yesterdayEnd = startOfDay(new Date());
    const rows = await db
      .select()
      .from(memories)
      .where(
        and(
          eq(memories.scope, "daily"),
          gte(memories.windowStart, yesterdayStart),
          lt(memories.windowStart, yesterdayEnd)
        )
      )
      .orderBy(desc(memories.windowStart))
      .limit(1);
    return rows[0];
  }

  async getTodayHourly(): Promise<Memory[]> {
    const todayStart = startOfDay(new Date());
    return db
      .select()
      .from(memories)
      .where(and(eq(memories.scope, "hourly"), gte(memories.windowStart, todayStart)))
      .orderBy(desc(memories.windowStart));
  }

  async list(scope: "hourly" | "daily", limit = 48): Promise<Memory[]> {
    return db
      .select()
      .from(memories)
      .where(eq(memories.scope, scope))
      .orderBy(desc(memories.windowStart))
      .limit(limit);
  }
}

export const memoryStore = new MemoryStore();

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
