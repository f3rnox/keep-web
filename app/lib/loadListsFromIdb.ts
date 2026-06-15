import type { NoteList } from './types'
import { coerceList } from './coerceList'
import { idbTransactionDone } from './idbTransactionDone'
import { openDb } from './openDb'

/**
 * Loads all lists from the IndexedDB `lists` object store.
 */
export async function loadListsFromIdb(): Promise<ReadonlyArray<NoteList>> {
  const db: IDBDatabase = await openDb()
  const transaction: IDBTransaction = db.transaction('lists', 'readonly')
  const store: IDBObjectStore = transaction.objectStore('lists')
  const request: IDBRequest<unknown[]> = store.getAll()

  const raw: unknown[] = await new Promise<unknown[]>((resolve: (value: unknown[]) => void, reject: (error: DOMException | null) => void): void => {
    request.onsuccess = (): void => resolve(request.result)
    request.onerror = (): void => reject(request.error)
  })

  await idbTransactionDone(transaction)
  db.close()

  return raw
    .map((entry: unknown): NoteList | null => coerceList(entry))
    .filter((list: NoteList | null): list is NoteList => list !== null)
}
