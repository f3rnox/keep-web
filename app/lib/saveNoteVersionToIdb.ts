import type { NoteVersion } from './types'
import { idbTransactionDone } from './idbTransactionDone'
import { openDb } from './openDb'

/**
 * Persists a note version snapshot to IndexedDB.
 *
 * @param version Version snapshot to store.
 */
export async function saveNoteVersionToIdb(version: NoteVersion): Promise<void> {
  const db: IDBDatabase = await openDb()
  const transaction: IDBTransaction = db.transaction('noteVersions', 'readwrite')
  const store: IDBObjectStore = transaction.objectStore('noteVersions')

  store.put(version)

  await idbTransactionDone(transaction)
  db.close()
}
