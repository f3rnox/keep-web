import type { NoteList } from './types'
import { idbTransactionDone } from './idbTransactionDone'
import { openDb } from './openDb'

/**
 * Replaces all lists in IndexedDB with the supplied collection.
 *
 * @param lists Full lists collection to persist.
 */
export async function saveListsToIdb(lists: ReadonlyArray<NoteList>): Promise<void> {
  const db: IDBDatabase = await openDb()
  const transaction: IDBTransaction = db.transaction('lists', 'readwrite')
  const store: IDBObjectStore = transaction.objectStore('lists')

  store.clear()
  for (const list of lists) {
    store.put(list)
  }

  await idbTransactionDone(transaction)
  db.close()
}
