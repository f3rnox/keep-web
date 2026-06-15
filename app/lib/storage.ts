import type { Note } from './types'
import { coerceNote } from './coerceNote'
import { loadNotesFromIdb } from './loadNotesFromIdb'
import { migrateToIdb } from './migrateToIdb'
import { purgeExpiredTrash } from './purgeExpiredTrash'

/**
 * `localStorage` key under which the entire notes collection was serialized as
 * JSON before IndexedDB migration.
 */
export const STORAGE_KEY: string = 'keepspark:notes:v1'

/**
 * Loads notes from IndexedDB, running a one-time migration when needed.
 */
export async function loadNotesAsync(): Promise<ReadonlyArray<Note>> {
  if (typeof window === 'undefined') return []

  await migrateToIdb()
  const notes: ReadonlyArray<Note> = await loadNotesFromIdb()
  const purged: ReadonlyArray<Note> = purgeExpiredTrash(notes)

  if (purged.length !== notes.length) {
    const { saveNotesToIdb } = await import('./saveNotesToIdb')
    await saveNotesToIdb(purged)
  }

  return purged
}

/**
 * Synchronous legacy loader kept for migration reads only.
 */
export function loadNotesFromLocalStorage(): ReadonlyArray<Note> {
  if (typeof window === 'undefined') return []

  try {
    const raw: string | null = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((entry: unknown): Note | null => coerceNote(entry))
      .filter((note: Note | null): note is Note => note !== null)
  } catch {
    return []
  }
}
