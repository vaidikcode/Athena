import { StateGraph, Annotation, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { BaseMessage } from "@langchain/core/messages";
import type { StructuredTool } from "@langchain/core/tools";
import type { Rule, Memory } from "@/lib/db";
import type { AgentState } from "./state";
import { loadContext, collect, makeReasonNode, propose, summarize } from "./nodes";
import type { LLMProvider } from "@/lib/llm/types";

// Define state annotation using LangGraph's Annotation API
const AgentAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
    default: () => [],
  }),
  kind: Annotation<"hourly" | "daily">({
    reducer: (_, b) => b,
    default: () => "hourly",
  }),
  windowStart: Annotation<Date>({
    reducer: (_, b) => b,
    default: () => new Date(),
  }),
  windowEnd: Annotation<Date>({
    reducer: (_, b) => b,
    default: () => new Date(),
  }),
  rules: Annotation<Rule[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  priorDaily: Annotation<Memory | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  lastHourly: Annotation<Memory | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  collected: Annotation<Record<string, unknown>>({
    reducer: (_, b) => b,
    default: () => ({}),
  }),
  proposals: Annotation<AgentState["proposals"]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  summary: Annotation<string>({
    reducer: (_, b) => b,
    default: () => "",
  }),
  runId: Annotation<string>({
    reducer: (_, b) => b,
    default: () => "",
  }),
});

type GraphState = typeof AgentAnnotation.State;

function shouldContinue(state: GraphState): "tools" | "propose" {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as BaseMessage & {
    tool_calls?: Array<unknown>;
  };
  if (lastMessage?.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  return "propose";
}

export function buildAgentGraph(tools: StructuredTool[], llmProvider: LLMProvider) {
  const reasonNode = makeReasonNode(tools, () => llmProvider.chat());
  const toolNode = new ToolNode<GraphState>(tools);

  const graph = new StateGraph(AgentAnnotation)
    .addNode("loadContext", loadContext as (s: GraphState) => Promise<Partial<GraphState>>)
    .addNode("collect", collect as (s: GraphState) => Promise<Partial<GraphState>>)
    .addNode("reason", reasonNode as (s: GraphState) => Promise<Partial<GraphState>>)
    .addNode("tools", toolNode)
    .addNode("propose", propose as (s: GraphState) => Promise<Partial<GraphState>>)
    .addNode("summarize", summarize as (s: GraphState) => Promise<Partial<GraphState>>)
    .addEdge("__start__", "loadContext")
    .addEdge("loadContext", "collect")
    .addEdge("collect", "reason")
    .addConditionalEdges("reason", shouldContinue, {
      tools: "tools",
      propose: "propose",
    })
    .addEdge("tools", "reason")
    .addEdge("propose", "summarize")
    .addEdge("summarize", END);

  return graph.compile();
}
