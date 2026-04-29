import type { Note } from './types'

/**
 * `localStorage` key under which the entire notes collection is serialized as
 * JSON. Bumped if the stored shape ever changes.
 */
export const STORAGE_KEY: string = 'keep-web:notes:v1'

/**
 * Loads the persisted notes collection from `localStorage`. Always returns an
 * array, even when storage is empty, missing, or contains malformed JSON.
 */
export function loadNotes(): ReadonlyArray<Note> {
  if (typeof window === 'undefined') return []

  try {
    const raw: string | null = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (entry: unknown): entry is Note =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as Note).id === 'string' &&
        typeof (entry as Note).title === 'string' &&
        typeof (entry as Note).content === 'string',
    )
  } catch {
    return []
  }
}
