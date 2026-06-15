import type { Note } from './types'

const MAX_HISTORY: number = 50

let past: ReadonlyArray<Note>[] = []
let future: ReadonlyArray<Note>[] = []

/**
 * Pushes the current notes snapshot onto the undo stack.
 *
 * @param snapshot Notes state before a mutation.
 */
export function pushNotesHistory(snapshot: ReadonlyArray<Note>): void {
  past = [...past, snapshot.map((note: Note): Note => ({ ...note }))]
  if (past.length > MAX_HISTORY) past = past.slice(past.length - MAX_HISTORY)
  future = []
}

/**
 * Returns whether an undo operation is available.
 */
export function canUndoNotes(): boolean {
  return past.length > 0
}

/**
 * Returns whether a redo operation is available.
 */
export function canRedoNotes(): boolean {
  return future.length > 0
}

/**
 * Pops the previous notes snapshot from the undo stack.
 */
export function popNotesUndo(): ReadonlyArray<Note> | null {
  if (past.length === 0) return null
  const previous: ReadonlyArray<Note> = past[past.length - 1]
  past = past.slice(0, -1)
  return previous
}

/**
 * Pushes the current snapshot onto the redo stack before applying undo.
 *
 * @param current Current notes snapshot being undone.
 */
export function pushNotesRedo(current: ReadonlyArray<Note>): void {
  future = [...future, current.map((note: Note): Note => ({ ...note }))]
}

/**
 * Pops the next notes snapshot from the redo stack.
 */
export function popNotesRedo(): ReadonlyArray<Note> | null {
  if (future.length === 0) return null
  const next: ReadonlyArray<Note> = future[future.length - 1]
  future = future.slice(0, -1)
  return next
}

/**
 * Clears undo/redo history.
 */
export function clearNotesHistory(): void {
  past = []
  future = []
}
