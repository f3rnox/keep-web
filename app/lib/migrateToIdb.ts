import type { Note, NoteList } from './types'
import { coerceList } from './coerceList'
import { coerceNote } from './coerceNote'
import { idbTransactionDone } from './idbTransactionDone'
import { openDb } from './openDb'
import { LISTS_STORAGE_KEY } from './listsStorage'
import { STORAGE_KEY } from './storage'

const MIGRATED_KEY: string = 'idb-migrated'

/**
 * One-time migration from `localStorage` JSON blobs into IndexedDB.
 */
export async function migrateToIdb(): Promise<void> {
  if (typeof window === 'undefined') return

  const db: IDBDatabase = await openDb()
  const metaTx: IDBTransaction = db.transaction('meta', 'readwrite')
  const metaStore: IDBObjectStore = metaTx.objectStore('meta')

  const alreadyMigrated: boolean = await new Promise<boolean>((resolve: (value: boolean) => void): void => {
    const request: IDBRequest<{ key: string; value: boolean } | undefined> = metaStore.get(MIGRATED_KEY)
    request.onsuccess = (): void => resolve(request.result?.value === true)
    request.onerror = (): void => resolve(false)
  })

  if (alreadyMigrated) {
    await idbTransactionDone(metaTx)
    db.close()
    return
  }

  const notesRaw: string | null = window.localStorage.getItem(STORAGE_KEY)
  const listsRaw: string | null = window.localStorage.getItem(LISTS_STORAGE_KEY)
  const hasLocalData: boolean = notesRaw !== null || listsRaw !== null

  if (hasLocalData) {
    const notes: Note[] = []
    const lists: NoteList[] = []

    if (notesRaw !== null) {
      try {
        const parsed: unknown = JSON.parse(notesRaw)
        if (Array.isArray(parsed)) {
          for (const entry of parsed) {
            const note: Note | null = coerceNote(entry)
            if (note !== null) notes.push(note)
          }
        }
      } catch {
        /* ignore malformed JSON */
      }
    }

    if (listsRaw !== null) {
      try {
        const parsed: unknown = JSON.parse(listsRaw)
        if (Array.isArray(parsed)) {
          for (const entry of parsed) {
            const list: NoteList | null = coerceList(entry)
            if (list !== null) lists.push(list)
          }
        }
      } catch {
        /* ignore malformed JSON */
      }
    }

    const notesTx: IDBTransaction = db.transaction('notes', 'readwrite')
    const notesStore: IDBObjectStore = notesTx.objectStore('notes')
    notesStore.clear()
    for (const note of notes) notesStore.put(note)
    await idbTransactionDone(notesTx)

    const listsTx: IDBTransaction = db.transaction('lists', 'readwrite')
    const listsStore: IDBObjectStore = listsTx.objectStore('lists')
    listsStore.clear()
    for (const list of lists) listsStore.put(list)
    await idbTransactionDone(listsTx)

    if (notesRaw !== null) window.localStorage.removeItem(STORAGE_KEY)
    if (listsRaw !== null) window.localStorage.removeItem(LISTS_STORAGE_KEY)
  }

  metaStore.put({ key: MIGRATED_KEY, value: true })
  await idbTransactionDone(metaTx)
  db.close()
}
