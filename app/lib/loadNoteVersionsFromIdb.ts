import type { NoteVersion } from './types'
import { coerceNoteVersion } from './coerceNoteVersion'
import { idbTransactionDone } from './idbTransactionDone'
import { openDb } from './openDb'

/**
 * Loads saved versions for a note, newest first.
 *
 * @param noteId Note whose history should be loaded.
 */
export async function loadNoteVersionsFromIdb(
  noteId: string,
): Promise<ReadonlyArray<NoteVersion>> {
  const db: IDBDatabase = await openDb()
  const transaction: IDBTransaction = db.transaction('noteVersions', 'readonly')
  const store: IDBObjectStore = transaction.objectStore('noteVersions')
  const index: IDBIndex = store.index('noteId')
  const request: IDBRequest<unknown[]> = index.getAll(noteId)

  const raw: unknown[] = await new Promise<unknown[]>(
    (resolve: (value: unknown[]) => void, reject: (error: DOMException | null) => void): void => {
      request.onsuccess = (): void => resolve(request.result)
      request.onerror = (): void => reject(request.error)
    },
  )

  await idbTransactionDone(transaction)
  db.close()

  return raw
    .map((entry: unknown): NoteVersion | null => coerceNoteVersion(entry))
    .filter((version: NoteVersion | null): version is NoteVersion => version !== null)
    .sort((left: NoteVersion, right: NoteVersion): number => right.savedAt - left.savedAt)
}
