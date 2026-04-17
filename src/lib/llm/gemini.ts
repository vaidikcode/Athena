import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { LLMProvider } from "./types";

export class GeminiProvider implements LLMProvider {
  name = "gemini" as const;

  chat() {
    return new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.3,
    });
  }
}
