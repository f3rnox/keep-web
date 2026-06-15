import type { Note } from './types'
import { saveNotesToIdb } from './saveNotesToIdb'

/**
 * Persists the full notes collection to IndexedDB.
 *
 * @param notes The full notes collection to persist.
 */
export function saveNotes(notes: ReadonlyArray<Note>): void {
  if (typeof window === 'undefined') return

  void saveNotesToIdb(notes).catch((): void => {
    /* storage may be unavailable */
  })
}
