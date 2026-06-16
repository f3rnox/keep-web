import type { NoteVersion } from './types'
import { loadNoteVersionsFromIdb } from './loadNoteVersionsFromIdb'
import { saveNoteVersionToIdb } from './saveNoteVersionToIdb'
import { idbTransactionDone } from './idbTransactionDone'
import { openDb } from './openDb'

const MAX_VERSIONS_PER_NOTE: number = 50

/**
 * Deletes the oldest stored versions for a note beyond the configured limit.
 *
 * @param noteId Note whose history should be trimmed.
 */
async function trimNoteVersions(noteId: string): Promise<void> {
  const versions: ReadonlyArray<NoteVersion> = await loadNoteVersionsFromIdb(noteId)
  if (versions.length <= MAX_VERSIONS_PER_NOTE) return

  const excess: ReadonlyArray<NoteVersion> = versions.slice(MAX_VERSIONS_PER_NOTE)
  const db: IDBDatabase = await openDb()
  const transaction: IDBTransaction = db.transaction('noteVersions', 'readwrite')
  const store: IDBObjectStore = transaction.objectStore('noteVersions')

  for (const version of excess) {
    store.delete(version.id)
  }

  await idbTransactionDone(transaction)
  db.close()
}

/**
 * Stores a pre-save snapshot of a note in per-note version history.
 *
 * @param version Version snapshot to persist.
 */
export async function pushNoteVersion(version: NoteVersion): Promise<void> {
  await saveNoteVersionToIdb(version)
  await trimNoteVersions(version.noteId)
}
