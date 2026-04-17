import "server-only";
import { tool, type ToolSet } from "ai";
import type { StructuredTool } from "@langchain/core/tools";
import type { ZodTypeAny } from "zod";
import { buildToolRegistry } from "@/lib/tools/registry";

/**
 * Wrap LangChain StructuredTools as AI SDK tools so `streamText` + `useChat`
 * get first-class tool-call / tool-result streaming in the UI.
 */
export function buildPhukoAiToolSet(): ToolSet {
  const registry = buildToolRegistry();
  const out: ToolSet = {};

  for (const t of registry) {
    const st = t as StructuredTool & { schema?: ZodTypeAny };
    const name = st.name;
    const schema = st.schema;
    if (!name || !schema) continue;

    out[name] = tool({
      description: st.description,
      inputSchema: schema,
      execute: async (input) => {
        try {
          const raw = await st.invoke(input as never);
          if (name === "create_event") {
            const s = typeof raw === "string" ? raw : JSON.stringify(raw);
            // #region agent log
            fetch("http://127.0.0.1:7591/ingest/73c4b017-15bb-4995-8b45-c03b8545c6c9", {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "218496" },
              body: JSON.stringify({
                sessionId: "218496",
                hypothesisId: "H2",
                location: "phuko-tools.ts:execute",
                message: "create_event invoke ok",
                data: {
                  outLen: s.length,
                  hasErrorKey: s.includes('"error"'),
                  preview: s.slice(0, 120),
                },
                timestamp: Date.now(),
              }),
            }).catch(() => {});
            // #endregion
          }
          if (typeof raw === "string") return raw;
          try {
            return JSON.stringify(raw);
          } catch {
            return String(raw);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          // #region agent log
          fetch("http://127.0.0.1:7591/ingest/73c4b017-15bb-4995-8b45-c03b8545c6c9", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "218496" },
            body: JSON.stringify({
              sessionId: "218496",
              hypothesisId: "H2",
              location: "phuko-tools.ts:execute",
              message: "tool invoke catch",
              data: { tool: name, err: msg.slice(0, 400) },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
          return JSON.stringify({ error: msg, tool: name });
        }
      },
    });
  }

  return out;
}
