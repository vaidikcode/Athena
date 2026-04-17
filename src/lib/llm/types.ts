import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export interface LLMProvider {
  chat(): BaseChatModel;
  name: "gemini" | "ollama";
}
