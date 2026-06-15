import type { Note } from './types'
import { loadNotesAsync } from './storage'
import { saveNotes } from './saveNotes'
import {
  canRedoNotes,
  canUndoNotes,
  clearNotesHistory,
  popNotesRedo,
  popNotesUndo,
  pushNotesHistory,
  pushNotesRedo,
} from './notesHistory'

/**
 * Options controlling how `setNotes` records undo history.
 */
export interface SetNotesOptions {
  recordHistory?: boolean
}

let snapshot: ReadonlyArray<Note> = []
let hydrated: boolean = false
let hydrating: Promise<void> | null = null
let historyVersion: number = 0
const listeners: Set<() => void> = new Set()
const historyListeners: Set<() => void> = new Set()

/** Stable empty snapshot returned during SSR; must be referentially cached. */
const SERVER_SNAPSHOT: ReadonlyArray<Note> = []

function notifyListeners(): void {
  for (const listener of listeners) listener()
}

function notifyHistoryListeners(): void {
  historyVersion += 1
  for (const listener of historyListeners) listener()
}

function startHydration(): void {
  if (hydrated || hydrating !== null || typeof window === 'undefined') return

  hydrating = loadNotesAsync()
    .then((notes: ReadonlyArray<Note>): void => {
      snapshot = notes
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
 * Returns the current notes snapshot, lazily hydrating from IndexedDB
 * on first call from a browser environment.
 */
export function getNotesSnapshot(): ReadonlyArray<Note> {
  startHydration()
  return snapshot
}

/**
 * Returns the server-side snapshot (always an empty array) used by
 * `useSyncExternalStore` during SSR.
 */
export function getNotesServerSnapshot(): ReadonlyArray<Note> {
  return SERVER_SNAPSHOT
}

/**
 * Registers a subscriber that's invoked whenever the notes snapshot changes.
 *
 * @param listener Callback invoked on every snapshot update.
 */
export function subscribeNotes(listener: () => void): () => void {
  listeners.add(listener)
  return (): void => {
    listeners.delete(listener)
  }
}

/**
 * Registers a subscriber for undo/redo availability changes.
 *
 * @param listener Callback invoked when history state changes.
 */
export function subscribeNotesHistory(listener: () => void): () => void {
  historyListeners.add(listener)
  return (): void => {
    historyListeners.delete(listener)
  }
}

/**
 * Snapshot token used to re-render undo/redo controls.
 */
export function getNotesHistoryVersion(): number {
  return historyVersion
}

/**
 * Indicates whether the store has loaded its initial value from IndexedDB.
 */
export function isNotesHydrated(): boolean {
  return hydrated
}

/**
 * Replaces the current snapshot with the result of `updater`, persists it,
 * and notifies all subscribers.
 *
 * @param updater Function receiving the previous snapshot, returning the next one.
 * @param options Controls undo history recording.
 */
export function setNotes(
  updater: (prev: ReadonlyArray<Note>) => ReadonlyArray<Note>,
  options: SetNotesOptions = {},
): void {
  if (typeof window === 'undefined') return
  startHydration()
  const recordHistory: boolean = options.recordHistory !== false
  const prev: ReadonlyArray<Note> = snapshot
  const next: ReadonlyArray<Note> = updater(snapshot)
  if (next === snapshot) return
  if (recordHistory) {
    pushNotesHistory(prev)
    notifyHistoryListeners()
  }
  snapshot = next
  saveNotes(snapshot)
  notifyListeners()
}

/**
 * Restores the previous notes snapshot from the undo stack.
 */
export function undoNotes(): void {
  if (typeof window === 'undefined') return
  const previous: ReadonlyArray<Note> | null = popNotesUndo()
  if (previous === null) return
  pushNotesRedo(snapshot)
  snapshot = previous
  saveNotes(snapshot)
  notifyListeners()
  notifyHistoryListeners()
}

/**
 * Re-applies a previously undone notes snapshot.
 */
export function redoNotes(): void {
  if (typeof window === 'undefined') return
  const next: ReadonlyArray<Note> | null = popNotesRedo()
  if (next === null) return
  pushNotesHistory(snapshot)
  snapshot = next
  saveNotes(snapshot)
  notifyListeners()
  notifyHistoryListeners()
}

export { canUndoNotes, canRedoNotes, clearNotesHistory }
