import type { AIProvider } from "./types";

/**
 * Local, deterministic AI provider used when no external API key is configured.
 * It applies rule-based rewrites so the platform is fully functional offline.
 * Swap this for an OpenAI/Anthropic-backed provider by implementing `AIProvider`.
 */
export class LocalAIProvider implements AIProvider {
  readonly name = "local";

  async complete(prompt: string): Promise<string> {
    // Deterministic passthrough with light formatting for demo purposes.
    // Real providers would call an LLM here.
    return prompt.trim();
  }
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(prompt: string): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI request failed: ${res.status}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? "";
  }
}

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const key = process.env.OPENAI_API_KEY;
  cached = key ? new OpenAIProvider(key) : new LocalAIProvider();
  return cached;
}
