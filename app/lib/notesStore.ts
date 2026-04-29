import type { Note } from "./types";
import { loadNotes } from "./storage";
import { saveNotes } from "./saveNotes";

/**
 * Module-level reactive store backing every `useNotes` consumer. Reads and
 * writes through to `localStorage` and notifies subscribers via the
 * `useSyncExternalStore` contract.
 */

let snapshot: ReadonlyArray<Note> = [];
let hydrated: boolean = false;
const listeners: Set<() => void> = new Set();

function ensureHydrated(): void {
  if (hydrated) return;
  if (typeof window === "undefined") return;
  snapshot = loadNotes();
  hydrated = true;
}

/**
 * Returns the current notes snapshot, lazily hydrating from `localStorage`
 * on first call from a browser environment.
 */
export function getNotesSnapshot(): ReadonlyArray<Note> {
  ensureHydrated();
  return snapshot;
}

/**
 * Returns the server-side snapshot (always an empty array) used by
 * `useSyncExternalStore` during SSR.
 */
export function getNotesServerSnapshot(): ReadonlyArray<Note> {
  return [];
}

/**
 * Registers a subscriber that's invoked whenever the notes snapshot changes.
 *
 * @param listener Callback invoked on every snapshot update.
 */
export function subscribeNotes(listener: () => void): () => void {
  listeners.add(listener);
  return (): void => {
    listeners.delete(listener);
  };
}

/**
 * Indicates whether the store has loaded its initial value from
 * `localStorage` (only ever true in the browser).
 */
export function isNotesHydrated(): boolean {
  return hydrated;
}

/**
 * Replaces the current snapshot with the result of `updater`, persists it,
 * and notifies all subscribers. No-ops on the server.
 *
 * @param updater Function receiving the previous snapshot, returning the next one.
 */
export function setNotes(
  updater: (prev: ReadonlyArray<Note>) => ReadonlyArray<Note>,
): void {
  if (typeof window === "undefined") return;
  ensureHydrated();
  const next: ReadonlyArray<Note> = updater(snapshot);
  if (next === snapshot) return;
  snapshot = next;
  saveNotes(snapshot);
  for (const listener of listeners) listener();
}
