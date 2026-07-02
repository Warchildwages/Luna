// 🌙 Luna LLM Client
//
// Backported from Sigil's multi-provider LLM pattern.
// Supports: Venice, Gemini, OpenRouter, Groq, OpenAI — whichever is configured.
// Mirrors Sigil's lib/llm.ts pattern.

import { getLlmConfig } from './llm';
import type { LlmConfig } from './llm';

export interface LlmResponse {
  content: string;
  model: string;
  provider: string;
  processingTimeMs: number;
}

/**
 * Send a completion request to the best available LLM provider.
 * Priority: Venice → Gemini → OpenRouter → Groq → OpenAI.
 */
export async function complete(
  system: string,
  user: string,
): Promise<LlmResponse> {
  const config = getLlmConfig();

  if (config.provider === 'none') {
    throw new Error(
      `LLM_NOT_CONFIGURED: ${config.reason || 'No API key set. Set VENICE_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY.'}`,
    );
  }

  const start = Date.now();
  const res = await fetch(`${config.apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...config.headers,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`LLM error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return {
    content: data.choices?.[0]?.message?.content || '',
    model: config.model,
    provider: config.provider,
    processingTimeMs: Date.now() - start,
  };
}
