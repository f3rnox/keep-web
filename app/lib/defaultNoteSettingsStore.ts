import { normalizeLabel } from './normalizeLabel'
import { showSettingSaved } from './settingToastStore'

/**
 * Persisted defaults applied when creating new notes.
 */
export interface DefaultNoteSettings {
  defaultListId: string | null
  labelsByListId: Record<string, ReadonlyArray<string>>
}

const STORAGE_KEY: string = 'keepspark:default-note-settings:v1'

const DEFAULT_SETTINGS: DefaultNoteSettings = {
  defaultListId: null,
  labelsByListId: {},
}

const SERVER_SNAPSHOT: DefaultNoteSettings = DEFAULT_SETTINGS

let snapshot: DefaultNoteSettings = { ...DEFAULT_SETTINGS, labelsByListId: {} }
let hydrated: boolean = false
const listeners: Set<() => void> = new Set()

function normalizePresetLabels(labels: ReadonlyArray<string>): ReadonlyArray<string> {
  const seen: Set<string> = new Set()
  const next: string[] = []

  for (const raw of labels) {
    const label: string = normalizeLabel(raw)
    if (label.length === 0) continue
    const key: string = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    next.push(label)
  }

  return next
}

function coerceDefaultNoteSettings(raw: unknown): DefaultNoteSettings {
  if (typeof raw !== 'object' || raw === null) {
    return { ...DEFAULT_SETTINGS, labelsByListId: {} }
  }

  const record: Record<string, unknown> = raw as Record<string, unknown>
  const defaultListId: string | null =
    typeof record.defaultListId === 'string' ? record.defaultListId : null

  const labelsByListId: Record<string, ReadonlyArray<string>> = {}
  if (typeof record.labelsByListId === 'object' && record.labelsByListId !== null) {
    for (const [key, value] of Object.entries(record.labelsByListId as Record<string, unknown>)) {
      if (!Array.isArray(value)) continue
      labelsByListId[key] = normalizePresetLabels(
        value.filter((entry: unknown): entry is string => typeof entry === 'string'),
      )
    }
  }

  return { defaultListId, labelsByListId }
}

function ensureHydrated(): void {
  if (hydrated) return
  if (typeof window === 'undefined') return

  const raw: string | null = window.localStorage.getItem(STORAGE_KEY)
  if (raw !== null) {
    try {
      snapshot = coerceDefaultNoteSettings(JSON.parse(raw))
    } catch {
      snapshot = { ...DEFAULT_SETTINGS, labelsByListId: {} }
    }
  }

  hydrated = true
}

function persist(next: DefaultNoteSettings): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function notify(): void {
  for (const listener of listeners) listener()
}

/**
 * Returns the current default note settings snapshot.
 */
export function getDefaultNoteSettingsSnapshot(): DefaultNoteSettings {
  ensureHydrated()
  return snapshot
}

/**
 * Returns the server-side default note settings snapshot used during SSR.
 */
export function getDefaultNoteSettingsServerSnapshot(): DefaultNoteSettings {
  return SERVER_SNAPSHOT
}

/**
 * Registers a subscriber invoked whenever default note settings change.
 *
 * @param listener Callback invoked on every snapshot update.
 */
export function subscribeDefaultNoteSettings(listener: () => void): () => void {
  listeners.add(listener)
  return (): void => {
    listeners.delete(listener)
  }
}

/**
 * Updates default note settings and persists them to `localStorage`.
 *
 * @param patch Partial settings to merge into the stored snapshot.
 */
export function setDefaultNoteSettings(patch: Partial<DefaultNoteSettings>): void {
  if (typeof window === 'undefined') return
  ensureHydrated()

  const labelsByListId: Record<string, ReadonlyArray<string>> = {
    ...snapshot.labelsByListId,
    ...(patch.labelsByListId ?? {}),
  }

  const next: DefaultNoteSettings = {
    defaultListId:
      patch.defaultListId !== undefined ? patch.defaultListId : snapshot.defaultListId,
    labelsByListId,
  }

  if (
    next.defaultListId === snapshot.defaultListId &&
    JSON.stringify(next.labelsByListId) === JSON.stringify(snapshot.labelsByListId)
  ) {
    return
  }

  snapshot = next
  persist(next)
  notify()
  showSettingSaved('New note defaults saved')
}

/**
 * Sets the default list used for notes created from the home view.
 *
 * @param defaultListId List id, or `null` for the inbox.
 */
export function setDefaultListId(defaultListId: string | null): void {
  setDefaultNoteSettings({ defaultListId })
}

/**
 * Sets preset labels applied to new notes for a list or the inbox.
 *
 * @param listKey Map key from {@link listLabelsKey} or {@link INBOX_LIST_KEY}.
 * @param labels Preset labels to store for that target.
 */
export function setListPresetLabels(listKey: string, labels: ReadonlyArray<string>): void {
  if (typeof window === 'undefined') return
  ensureHydrated()

  const normalized: ReadonlyArray<string> = normalizePresetLabels(labels)
  const current: ReadonlyArray<string> = snapshot.labelsByListId[listKey] ?? []

  if (
    normalized.length === current.length &&
    normalized.every((label: string, index: number): boolean => label === current[index])
  ) {
    return
  }

  setDefaultNoteSettings({
    labelsByListId: {
      [listKey]: normalized,
    },
  })
}

/**
 * Restores default note settings to their initial values.
 */
export function resetDefaultNoteSettings(): void {
  if (typeof window === 'undefined') return
  ensureHydrated()

  snapshot = { ...DEFAULT_SETTINGS, labelsByListId: {} }

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore storage failures */
  }

  notify()
}
