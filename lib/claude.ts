/**
 * lib/claude.ts — thin wrapper around the Anthropic Messages API.
 *
 * API key is read from the EXPO_PUBLIC_CLAUDE_API_KEY env variable.
 * In development this is picked up automatically from the .env file.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL   = 'claude-opus-4-5';

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
 * @param systemPrompt  – top-level system instruction
 * @param messages      – prior conversation turns (can be empty)
 * @param userMessage   – the new user turn to append
 * @param maxTokens     – upper token budget for the response
 */
export async function askClaude(
  systemPrompt: string,
  messages: ClaudeMessage[],
  userMessage: string,
  maxTokens = 1500,
): Promise<string> {
  if (!API_KEY) {
    throw new Error(
      'Claude API key not configured. Set EXPO_PUBLIC_CLAUDE_API_KEY in your .env file.',
    );
  }

  const body = {
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
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
      throw new Error('Перевищено час очікування відповіді від AI (60 с). Спробуйте ще раз.');
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
  return text;
}
