import type { Note } from './types'
import { STORAGE_KEY } from './storage'

/**
 * Serializes the supplied notes array and writes it to `localStorage`.
 * Silently no-ops on the server or if storage access throws (e.g. quota
 * exceeded, private mode).
 *
 * @param notes The full notes collection to persist.
 */
export function saveNotes(notes: ReadonlyArray<Note>): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {
    // Ignored: storage may be unavailable or full.
  }
}
