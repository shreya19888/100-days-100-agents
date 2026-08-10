import { completeOpenAIJson, isOpenAIConfigured } from "./openai";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIProvider {
  name: string;
  isConfigured(): boolean;
  completeJson(messages: ChatMessage[]): Promise<string>;
}

export class OpenAICompatibleProvider implements AIProvider {
  name = "openai";

  isConfigured(): boolean {
    return isOpenAIConfigured();
  }

  async completeJson(messages: ChatMessage[]): Promise<string> {
    return completeOpenAIJson(messages);
  }
}

export function getAIProvider(): AIProvider {
  return new OpenAICompatibleProvider();
}
