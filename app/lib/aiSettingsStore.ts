import { showSettingSaved } from './settingToastStore'

/**
 * Supported AI providers for title suggestions.
 */
export type AiProvider = 'google' | 'anthropic'

/**
 * Persisted AI configuration for note title suggestions.
 */
export interface AiSettings {
  provider: AiProvider
  googleApiKey: string
  anthropicApiKey: string
}

const STORAGE_KEY: string = 'keepspark:ai-settings:v1'

const DEFAULT_SETTINGS: AiSettings = {
  provider: 'google',
  googleApiKey: '',
  anthropicApiKey: '',
}

const SERVER_SNAPSHOT: AiSettings = DEFAULT_SETTINGS

let snapshot: AiSettings = { ...DEFAULT_SETTINGS }
let hydrated: boolean = false
const listeners: Set<() => void> = new Set()

function isAiProvider(value: unknown): value is AiProvider {
  return value === 'google' || value === 'anthropic'
}

function coerceAiSettings(raw: unknown): AiSettings {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_SETTINGS }

  const record: Record<string, unknown> = raw as Record<string, unknown>
  const provider: AiProvider = isAiProvider(record.provider) ? record.provider : 'google'
  const googleApiKey: string = typeof record.googleApiKey === 'string' ? record.googleApiKey : ''
  const anthropicApiKey: string =
    typeof record.anthropicApiKey === 'string' ? record.anthropicApiKey : ''

  return { provider, googleApiKey, anthropicApiKey }
}

function ensureHydrated(): void {
  if (hydrated) return
  if (typeof window === 'undefined') return

  const raw: string | null = window.localStorage.getItem(STORAGE_KEY)
  if (raw !== null) {
    try {
      snapshot = coerceAiSettings(JSON.parse(raw))
    } catch {
      snapshot = { ...DEFAULT_SETTINGS }
    }
  }

  hydrated = true
}

function persist(next: AiSettings): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function notify(): void {
  for (const listener of listeners) listener()
}

/**
 * Returns the current AI settings snapshot.
 */
export function getAiSettingsSnapshot(): AiSettings {
  ensureHydrated()
  return snapshot
}

/**
 * Returns the server-side AI settings snapshot used during SSR.
 */
export function getAiSettingsServerSnapshot(): AiSettings {
  return SERVER_SNAPSHOT
}

/**
 * Registers a subscriber invoked whenever AI settings change.
 *
 * @param listener Callback invoked on every snapshot update.
 */
export function subscribeAiSettings(listener: () => void): () => void {
  listeners.add(listener)
  return (): void => {
    listeners.delete(listener)
  }
}

/**
 * Updates AI settings and persists them to `localStorage`.
 *
 * @param patch Partial settings to merge into the stored snapshot.
 */
export function setAiSettings(patch: Partial<AiSettings>): void {
  if (typeof window === 'undefined') return
  ensureHydrated()

  const next: AiSettings = {
    provider: patch.provider ?? snapshot.provider,
    googleApiKey: patch.googleApiKey ?? snapshot.googleApiKey,
    anthropicApiKey: patch.anthropicApiKey ?? snapshot.anthropicApiKey,
  }

  if (
    next.provider === snapshot.provider &&
    next.googleApiKey === snapshot.googleApiKey &&
    next.anthropicApiKey === snapshot.anthropicApiKey
  ) {
    return
  }

  snapshot = next
  persist(next)
  notify()
  showSettingSaved('AI settings saved')
}

/**
 * Returns whether the active provider has an API key configured.
 */
export function isAiTitleSuggestionConfigured(): boolean {
  const settings: AiSettings = getAiSettingsSnapshot()
  if (settings.provider === 'google') return settings.googleApiKey.trim().length > 0
  return settings.anthropicApiKey.trim().length > 0
}

/**
 * Returns the API key for the currently selected provider.
 */
export function getActiveAiApiKey(): string | null {
  const settings: AiSettings = getAiSettingsSnapshot()
  const key: string =
    settings.provider === 'google' ? settings.googleApiKey : settings.anthropicApiKey
  const trimmed: string = key.trim()
  return trimmed.length > 0 ? trimmed : null
}
