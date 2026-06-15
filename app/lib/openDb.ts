/** IndexedDB database name for KeepSpark persistence. */
export const DB_NAME: string = 'keepspark'

/** IndexedDB schema version. */
export const DB_VERSION: number = 1

/**
 * Opens (or creates) the KeepSpark IndexedDB database.
 */
export function openDb(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve: (db: IDBDatabase) => void, reject: (error: DOMException | null) => void): void => {
    const request: IDBOpenDBRequest = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (): void => {
      const db: IDBDatabase = request.result
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('lists')) {
        db.createObjectStore('lists', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' })
      }
    }

    request.onsuccess = (): void => resolve(request.result)
    request.onerror = (): void => reject(request.error)
  })
}
