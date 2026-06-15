import type { NoteSort } from './types'

const STORAGE_KEY: string = 'keepspark:sort'

let snapshot: NoteSort = 'updated'
let hydrated: boolean = false
const listeners: Set<() => void> = new Set()

const SERVER_SNAPSHOT: NoteSort = 'updated'

function ensureHydrated(): void {
  if (hydrated) return
  if (typeof window === 'undefined') return
  const raw: string | null = window.localStorage.getItem(STORAGE_KEY)
  const valid: ReadonlyArray<NoteSort> = ['updated', 'created', 'title', 'color', 'due', 'custom']
  if (raw !== null && (valid as ReadonlyArray<string>).includes(raw)) {
    snapshot = raw as NoteSort
  }
  hydrated = true
}

/**
 * Returns the current sort preference snapshot.
 */
export function getSortSnapshot(): NoteSort {
  ensureHydrated()
  return snapshot
}

/**
 * Returns the server-side sort snapshot used during SSR.
 */
export function getSortServerSnapshot(): NoteSort {
  return SERVER_SNAPSHOT
}

/**
 * Registers a subscriber invoked whenever the sort preference changes.
 *
 * @param listener Callback invoked on every snapshot update.
 */
export function subscribeSort(listener: () => void): () => void {
  listeners.add(listener)
  return (): void => {
    listeners.delete(listener)
  }
}

/**
 * Updates the sort preference and persists it to `localStorage`.
 *
 * @param next New sort criterion.
 */
export function setSort(next: NoteSort): void {
  if (typeof window === 'undefined') return
  ensureHydrated()
  if (next === snapshot) return
  snapshot = next
  window.localStorage.setItem(STORAGE_KEY, next)
  for (const listener of listeners) listener()
}
