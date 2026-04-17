import type { StructuredTool } from "@langchain/core/tools";
import { ruleCrudTools } from "@/lib/rules/tools";
import { calendarTools } from "@/lib/calendar/tools";
import { collectorTools } from "./collectors";

/**
 * Build the full tool registry for the agent.
 * Synchronous — no MCP subprocess needed.
 */
export function buildToolRegistry(): StructuredTool[] {
  return [
    ...collectorTools,
    ...ruleCrudTools,
    ...calendarTools,
  ];
}

/** Returns tool names grouped by source — useful for debugging */
export function describeRegistry(tools: StructuredTool[]) {
  return tools.map((t) => ({ name: t.name, description: t.description.slice(0, 80) }));
}
