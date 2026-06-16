import { idbTransactionDone } from './idbTransactionDone'
import { openDb } from './openDb'

/**
 * Deletes a single stored version snapshot from IndexedDB.
 *
 * @param versionId Version record id to remove.
 */
export async function deleteNoteVersionFromIdb(versionId: string): Promise<void> {
  const db: IDBDatabase = await openDb()
  const transaction: IDBTransaction = db.transaction('noteVersions', 'readwrite')
  const store: IDBObjectStore = transaction.objectStore('noteVersions')

  store.delete(versionId)

  await idbTransactionDone(transaction)
  db.close()
}
