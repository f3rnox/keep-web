import type { NoteList } from './types'
import { loadListsAsync } from './listsStorage'
import { saveLists } from './saveLists'

let snapshot: ReadonlyArray<NoteList> = []
let hydrated: boolean = false
let hydrating: Promise<void> | null = null
const listeners: Set<() => void> = new Set()

/** Stable empty snapshot returned during SSR. */
const SERVER_SNAPSHOT: ReadonlyArray<NoteList> = []

function notifyListeners(): void {
  for (const listener of listeners) listener()
}

function startHydration(): void {
  if (hydrated || hydrating !== null || typeof window === 'undefined') return

  hydrating = loadListsAsync()
    .then((lists: ReadonlyArray<NoteList>): void => {
      snapshot = lists
      hydrated = true
      hydrating = null
      notifyListeners()
    })
    .catch((): void => {
      snapshot = []
      hydrated = true
      hydrating = null
      notifyListeners()
    })
}

/**
 * Returns the current lists snapshot, lazily hydrating from IndexedDB.
 */
export function getListsSnapshot(): ReadonlyArray<NoteList> {
  startHydration()
  return snapshot
}

/**
 * Returns the server-side snapshot used by `useSyncExternalStore` during SSR.
 */
export function getListsServerSnapshot(): ReadonlyArray<NoteList> {
  return SERVER_SNAPSHOT
}

/**
 * Registers a subscriber invoked whenever the lists snapshot changes.
 *
 * @param listener Callback invoked on every snapshot update.
 */
export function subscribeLists(listener: () => void): () => void {
  listeners.add(listener)
  return (): void => {
    listeners.delete(listener)
  }
}

/**
 * Replaces the current lists snapshot, persists it, and notifies subscribers.
 *
 * @param updater Function receiving the previous snapshot, returning the next one.
 */
export function setLists(
  updater: (prev: ReadonlyArray<NoteList>) => ReadonlyArray<NoteList>,
): void {
  if (typeof window === 'undefined') return
  startHydration()
  const next: ReadonlyArray<NoteList> = updater(snapshot)
  if (next === snapshot) return
  snapshot = next
  saveLists(snapshot)
  notifyListeners()
}
