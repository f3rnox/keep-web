import { idbTransactionDone } from './idbTransactionDone'
import { openDb } from './openDb'

/**
 * Deletes every stored version for a note.
 *
 * @param noteId Note whose version history should be removed.
 */
export async function deleteNoteVersionsForNote(noteId: string): Promise<void> {
  const db: IDBDatabase = await openDb()
  const transaction: IDBTransaction = db.transaction('noteVersions', 'readwrite')
  const store: IDBObjectStore = transaction.objectStore('noteVersions')
  const index: IDBIndex = store.index('noteId')
  const request: IDBRequest = index.openCursor(IDBKeyRange.only(noteId))

  await new Promise<void>((resolve: () => void, reject: (error: DOMException | null) => void): void => {
    request.onsuccess = (): void => {
      const cursor: IDBCursorWithValue | null = request.result
      if (cursor === null) {
        resolve()
        return
      }
      cursor.delete()
      cursor.continue()
    }
    request.onerror = (): void => reject(request.error)
  })

  await idbTransactionDone(transaction)
  db.close()
}
