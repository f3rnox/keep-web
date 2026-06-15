import type { NoteList } from './types'
import { saveListsToIdb } from './saveListsToIdb'

/**
 * Persists the full lists collection to IndexedDB.
 *
 * @param lists The full lists collection to persist.
 */
export function saveLists(lists: ReadonlyArray<NoteList>): void {
  if (typeof window === 'undefined') return

  void saveListsToIdb(lists).catch((): void => {
    /* storage may be unavailable */
  })
}
