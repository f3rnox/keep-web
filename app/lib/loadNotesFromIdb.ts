import type { Note } from './types'
import { coerceNote } from './coerceNote'
import { idbTransactionDone } from './idbTransactionDone'
import { openDb } from './openDb'
import { purgeExpiredTrash } from './purgeExpiredTrash'

/**
 * Loads all notes from the IndexedDB `notes` object store.
 */
export async function loadNotesFromIdb(): Promise<ReadonlyArray<Note>> {
  const db: IDBDatabase = await openDb()
  const transaction: IDBTransaction = db.transaction('notes', 'readonly')
  const store: IDBObjectStore = transaction.objectStore('notes')
  const request: IDBRequest<unknown[]> = store.getAll()

  const raw: unknown[] = await new Promise<unknown[]>((resolve: (value: unknown[]) => void, reject: (error: DOMException | null) => void): void => {
    request.onsuccess = (): void => resolve(request.result)
    request.onerror = (): void => reject(request.error)
  })

  await idbTransactionDone(transaction)
  db.close()

  const notes: ReadonlyArray<Note> = raw
    .map((entry: unknown): Note | null => coerceNote(entry))
    .filter((note: Note | null): note is Note => note !== null)

  return purgeExpiredTrash(notes)
}
