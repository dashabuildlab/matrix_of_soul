/**
 * lib/claude.ts — thin wrapper around the Anthropic Messages API.
 *
 * API key is read from the EXPO_PUBLIC_CLAUDE_API_KEY env variable.
 * In development this is picked up automatically from the .env file.
 *
 * LOCALE-AWARE: every call now appends a language instruction so Claude
 * responds in the user's selected app language. Pass `locale` to askClaude().
 * If omitted, defaults to 'en'.
 */

import { getLanguageInstruction } from './aiLocale';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL   = 'claude-haiku-4-5';

// In Expo SDK 49+ only EXPO_PUBLIC_ prefixed variables are inlined into the
// client bundle. Add EXPO_PUBLIC_CLAUDE_API_KEY=<key> to your .env file.
const API_KEY: string =
  (process.env.EXPO_PUBLIC_CLAUDE_API_KEY as string | undefined) ?? '';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Call the Claude API and return the assistant's text response.
 *
 * @param systemPrompt  – top-level system instruction (will be augmented with language directive)
 * @param messages      – prior conversation turns (can be empty)
 * @param userMessage   – the new user turn to append
 * @param maxTokens     – upper token budget for the response
 * @param locale        – user's app locale; injected as language instruction (default 'en')
 */
export async function askClaude(
  systemPrompt: string,
  messages: ClaudeMessage[],
  userMessage: string,
  maxTokens = 1500,
  locale: string = 'en',
): Promise<string> {
  if (!API_KEY) {
    throw new Error(
      'Claude API key not configured. Set EXPO_PUBLIC_CLAUDE_API_KEY in your .env file.',
    );
  }

  // Append the language instruction as the LAST line of the system prompt so
  // it overrides any hardcoded language hints baked into legacy prompts.
  const augmentedSystemPrompt = `${systemPrompt}\n\n${getLanguageInstruction(locale)}`;

  const body = {
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: augmentedSystemPrompt,
    messages: [
      ...messages,
      { role: 'user', content: userMessage },
    ],
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('AI response timeout (60s). Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? '';

  // Detect hard truncation — Claude hit the token ceiling mid-response.
  if (data.stop_reason === 'max_tokens') {
    throw new Error(
      `TRUNCATED:max_tokens — Claude response truncated (limit ${maxTokens} tokens). Section incomplete.`,
    );
  }

  return text;
}
