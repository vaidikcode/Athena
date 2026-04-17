import type { BaseMessage } from "@langchain/core/messages";
import type { Rule, Memory, Suggestion } from "@/lib/db";

export interface AgentState {
  messages: BaseMessage[];
  kind: "hourly" | "daily";
  windowStart: Date;
  windowEnd: Date;
  rules: Rule[];
  priorDaily: Memory | null;
  lastHourly: Memory | null;
  collected: Record<string, unknown>;
  proposals: Omit<Suggestion, "id" | "createdAt">[];
  summary: string;
  runId: string;
}

export type PartialAgentState = Partial<AgentState>;
