import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export function getChatModel(): LanguageModel {
  const provider = process.env.LLM_PROVIDER ?? "gemini";

  if (provider === "ollama") {
    const base = (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "");
    const ollama = createOpenAI({
      baseURL: `${base}/v1`,
      apiKey: "ollama",
    });
    return ollama.chat(process.env.OLLAMA_MODEL ?? "qwen2.5:7b-instruct");
  }

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY for chat.");
  }

  const genai = createGoogleGenerativeAI({ apiKey });
  return genai(process.env.GEMINI_MODEL ?? "gemini-2.0-flash");
}
