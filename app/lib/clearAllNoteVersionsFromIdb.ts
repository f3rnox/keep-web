import { idbTransactionDone } from './idbTransactionDone'
import { openDb } from './openDb'

/**
 * Removes all stored note version snapshots from IndexedDB.
 */
export async function clearAllNoteVersionsFromIdb(): Promise<void> {
  const db: IDBDatabase = await openDb()
  const transaction: IDBTransaction = db.transaction('noteVersions', 'readwrite')
  const store: IDBObjectStore = transaction.objectStore('noteVersions')

  store.clear()

  await idbTransactionDone(transaction)
  db.close()
}
