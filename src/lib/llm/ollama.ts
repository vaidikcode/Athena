import { ChatOllama } from "@langchain/ollama";
import type { LLMProvider } from "./types";

export class OllamaProvider implements LLMProvider {
  name = "ollama" as const;

  chat() {
    return new ChatOllama({
      model: process.env.OLLAMA_MODEL ?? "qwen2.5:7b-instruct",
      baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
      temperature: 0.3,
    });
  }
}
