/**
 * Resolves when an IndexedDB transaction completes successfully.
 *
 * @param transaction Transaction to await.
 */
export function idbTransactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve: () => void, reject: (error: DOMException | null) => void): void => {
    transaction.oncomplete = (): void => resolve()
    transaction.onerror = (): void => reject(transaction.error)
    transaction.onabort = (): void => reject(transaction.error)
  })
}
