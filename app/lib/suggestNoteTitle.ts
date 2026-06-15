import type { AiProvider } from './aiSettingsStore'
import { getActiveAiApiKey, getAiSettingsSnapshot } from './aiSettingsStore'

const MAX_CONTENT_CHARS: number = 4000
const MAX_TITLE_CHARS: number = 80

/**
 * Builds the prompt sent to the configured AI provider.
 *
 * @param content Note body used to infer a title.
 */
function buildTitleSuggestionPrompt(content: string): string {
  const trimmed: string = content.trim()
  const excerpt: string =
    trimmed.length > MAX_CONTENT_CHARS
      ? `${trimmed.slice(0, MAX_CONTENT_CHARS)}…`
      : trimmed

  return [
    'Suggest a short, descriptive title for the following note.',
    `Keep it under ${MAX_TITLE_CHARS} characters.`,
    'Return only the title text with no quotes, labels, or explanation.',
    '',
    'Note content:',
    excerpt,
  ].join('\n')
}

/**
 * Normalizes a model response into a single-line title.
 *
 * @param raw Raw text returned by the provider.
 */
function normalizeSuggestedTitle(raw: string): string {
  let title: string = raw.trim()
  if (
    (title.startsWith('"') && title.endsWith('"')) ||
    (title.startsWith("'") && title.endsWith("'"))
  ) {
    title = title.slice(1, -1).trim()
  }

  title = title.split('\n')[0]?.trim() ?? ''
  if (title.length > MAX_TITLE_CHARS) {
    title = title.slice(0, MAX_TITLE_CHARS).trim()
  }

  return title
}

/**
 * Requests a title suggestion from Google Gemini.
 *
 * @param apiKey Google AI API key.
 * @param prompt Prompt describing the note content.
 */
async function suggestTitleWithGoogle(apiKey: string, prompt: string): Promise<string> {
  const url: string =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent'

  const response: Response = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 64,
      },
    }),
  })

  if (!response.ok) {
    const detail: string = await response.text()
    throw new Error(detail.length > 0 ? detail : `Google AI request failed (${response.status})`)
  }

  const data: unknown = await response.json()
  const record: Record<string, unknown> =
    typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  const candidates: unknown = record.candidates
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('Google AI returned no title suggestion')
  }

  const first: unknown = candidates[0]
  const firstRecord: Record<string, unknown> =
    typeof first === 'object' && first !== null ? (first as Record<string, unknown>) : {}
  const content: unknown = firstRecord.content
  const contentRecord: Record<string, unknown> =
    typeof content === 'object' && content !== null ? (content as Record<string, unknown>) : {}
  const parts: unknown = contentRecord.parts
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error('Google AI returned an empty response')
  }

  const part: unknown = parts[0]
  const partRecord: Record<string, unknown> =
    typeof part === 'object' && part !== null ? (part as Record<string, unknown>) : {}
  const text: unknown = partRecord.text
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Google AI returned an empty title')
  }

  return normalizeSuggestedTitle(text)
}

/**
 * Requests a title suggestion from Anthropic Claude.
 *
 * @param apiKey Anthropic API key.
 * @param prompt Prompt describing the note content.
 */
async function suggestTitleWithAnthropic(apiKey: string, prompt: string): Promise<string> {
  const response: Response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 64,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const detail: string = await response.text()
    throw new Error(detail.length > 0 ? detail : `Anthropic request failed (${response.status})`)
  }

  const data: unknown = await response.json()
  const record: Record<string, unknown> =
    typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  const contentBlocks: unknown = record.content
  if (!Array.isArray(contentBlocks) || contentBlocks.length === 0) {
    throw new Error('Anthropic returned no title suggestion')
  }

  const block: unknown = contentBlocks[0]
  const blockRecord: Record<string, unknown> =
    typeof block === 'object' && block !== null ? (block as Record<string, unknown>) : {}
  const text: unknown = blockRecord.text
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Anthropic returned an empty title')
  }

  return normalizeSuggestedTitle(text)
}

/**
 * Uses the configured AI provider to suggest a title from note content.
 *
 * @param content Note body used to infer a title.
 */
export async function suggestNoteTitle(content: string): Promise<string> {
  const trimmedContent: string = content.trim()
  if (trimmedContent.length === 0) {
    throw new Error('Add some note content before requesting a title')
  }

  const apiKey: string | null = getActiveAiApiKey()
  if (apiKey === null) {
    throw new Error('Configure an AI API key in Settings → AI')
  }

  const provider: AiProvider = getAiSettingsSnapshot().provider
  const prompt: string = buildTitleSuggestionPrompt(trimmedContent)

  const suggested: string =
    provider === 'google'
      ? await suggestTitleWithGoogle(apiKey, prompt)
      : await suggestTitleWithAnthropic(apiKey, prompt)

  if (suggested.length === 0) {
    throw new Error('AI returned an empty title')
  }

  return suggested
}
