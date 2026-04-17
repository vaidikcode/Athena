export type { LLMProvider } from "./types";

export function getLLM() {
  const provider = process.env.LLM_PROVIDER ?? "gemini";

  if (provider === "ollama") {
    // Lazy import to avoid loading unless needed
    const { OllamaProvider } = require("./ollama") as typeof import("./ollama");
    return new OllamaProvider();
  }

  const { GeminiProvider } = require("./gemini") as typeof import("./gemini");
  return new GeminiProvider();
}
