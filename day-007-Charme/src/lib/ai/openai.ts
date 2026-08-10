import type { ChatMessage } from "./provider";

/**
 * Server-side OpenAI helper.
 * Reads OPENAI_API_KEY (preferred) or legacy AI_API_KEY.
 * Never import this into client components.
 */
export function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || process.env.AI_API_KEY?.trim() || undefined;
}

export function isOpenAIConfigured(): boolean {
  return Boolean(getOpenAIApiKey());
}

export function getOpenAIConfig() {
  return {
    apiKey: getOpenAIApiKey(),
    baseUrl: "https://api.openai.com/v1",
    model: process.env.AI_MODEL || "gpt-4o-mini",
  };
}

export async function completeOpenAIJson(messages: ChatMessage[]): Promise<string> {
  const { apiKey, baseUrl, model } = getOpenAIConfig();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error (${response.status})`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty content");
  }
  return content;
}
