import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ruleStore } from "./store";

export const listRulesTool = tool(
  async () => {
    const rules = await ruleStore.listEnabled();
    return JSON.stringify(rules, null, 2);
  },
  {
    name: "list_rules",
    description:
      "List all active user rules and policies. Rules guide how the agent should prioritize time, energy, and calendar decisions.",
    schema: z.object({}),
  }
);

export const createRuleTool = tool(
  async ({ title, body, priority, tags, confidence }) => {
    const rule = await ruleStore.create({
      title,
      body,
      priority: priority ?? 5,
      enabled: true,
      tags: tags ?? [],
      source: "agent",
      confidence: confidence ?? null,
    });
    return JSON.stringify(rule);
  },
  {
    name: "create_rule",
    description:
      "Create a new rule or policy the agent has learned. Use this when you detect a recurring pattern or when the user's behavior suggests a clear preference (e.g. 'protect evenings for family', 'avoid back-to-back meetings').",
    schema: z.object({
      title: z.string().describe("Short name for the rule"),
      body: z
        .string()
        .describe(
          "Full description of what the rule means and when it applies"
        ),
      priority: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .describe("Priority 1-10, higher = more important"),
      tags: z.array(z.string()).optional().describe("Category tags"),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("Agent's confidence 0-1 that this rule is correct"),
    }),
  }
);

export const updateRuleTool = tool(
  async ({ id, title, body, priority, enabled, tags }) => {
    const rule = await ruleStore.update(id, {
      ...(title !== undefined && { title }),
      ...(body !== undefined && { body }),
      ...(priority !== undefined && { priority }),
      ...(enabled !== undefined && { enabled }),
      ...(tags !== undefined && { tags }),
    });
    if (!rule) return JSON.stringify({ error: `Rule ${id} not found` });
    return JSON.stringify(rule);
  },
  {
    name: "update_rule",
    description: "Update an existing rule by ID.",
    schema: z.object({
      id: z.string().describe("Rule ID to update"),
      title: z.string().optional(),
      body: z.string().optional(),
      priority: z.number().min(1).max(10).optional(),
      enabled: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
    }),
  }
);

export const deleteRuleTool = tool(
  async ({ id }) => {
    await ruleStore.delete(id);
    return JSON.stringify({ deleted: id });
  },
  {
    name: "delete_rule",
    description: "Delete a rule by ID.",
    schema: z.object({
      id: z.string().describe("Rule ID to delete"),
    }),
  }
);

export const ruleCrudTools = [
  listRulesTool,
  createRuleTool,
  updateRuleTool,
  deleteRuleTool,
];
