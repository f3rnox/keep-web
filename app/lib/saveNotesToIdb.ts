import type { Note } from './types'
import { idbTransactionDone } from './idbTransactionDone'
import { openDb } from './openDb'

/**
 * Replaces all notes in IndexedDB with the supplied collection.
 *
 * @param notes Full notes collection to persist.
 */
export async function saveNotesToIdb(notes: ReadonlyArray<Note>): Promise<void> {
  const db: IDBDatabase = await openDb()
  const transaction: IDBTransaction = db.transaction('notes', 'readwrite')
  const store: IDBObjectStore = transaction.objectStore('notes')

  store.clear()
  for (const note of notes) {
    store.put(note)
  }

  await idbTransactionDone(transaction)
  db.close()
}
