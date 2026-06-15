import type { NoteList } from './types'
import { coerceList } from './coerceList'
import { loadListsFromIdb } from './loadListsFromIdb'
import { migrateToIdb } from './migrateToIdb'

/**
 * `localStorage` key under which named lists were serialized before IndexedDB migration.
 */
export const LISTS_STORAGE_KEY: string = 'keepspark:lists:v1'

/**
 * Loads lists from IndexedDB, running a one-time migration when needed.
 */
export async function loadListsAsync(): Promise<ReadonlyArray<NoteList>> {
  if (typeof window === 'undefined') return []

  await migrateToIdb()
  return loadListsFromIdb()
}

/**
 * Synchronous legacy loader kept for migration reads only.
 */
export function loadListsFromLocalStorage(): ReadonlyArray<NoteList> {
  if (typeof window === 'undefined') return []

  try {
    const raw: string | null = window.localStorage.getItem(LISTS_STORAGE_KEY)
    if (raw === null) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((entry: unknown): NoteList | null => coerceList(entry))
      .filter((list: NoteList | null): list is NoteList => list !== null)
  } catch {
    return []
  }
}
