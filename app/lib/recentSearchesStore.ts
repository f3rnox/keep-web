const STORAGE_KEY: string = 'keepspark:recent-searches:v1'
const MAX_RECENTS: number = 8

let snapshot: ReadonlyArray<string> = []
let hydrated: boolean = false
const listeners: Set<() => void> = new Set()

const SERVER_SNAPSHOT: ReadonlyArray<string> = []

function ensureHydrated(): void {
  if (hydrated) return
  if (typeof window === 'undefined') return
  try {
    const raw: string | null = window.localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        snapshot = parsed.filter((entry: unknown): entry is string => typeof entry === 'string')
      }
    }
  } catch {
    snapshot = []
  }
  hydrated = true
}

/**
 * Returns the current recent searches snapshot.
 */
export function getRecentSearchesSnapshot(): ReadonlyArray<string> {
  ensureHydrated()
  return snapshot
}

/**
 * Returns the server-side recent searches snapshot.
 */
export function getRecentSearchesServerSnapshot(): ReadonlyArray<string> {
  return SERVER_SNAPSHOT
}

/**
 * Registers a subscriber for recent search changes.
 *
 * @param listener Callback invoked on every update.
 */
export function subscribeRecentSearches(listener: () => void): () => void {
  listeners.add(listener)
  return (): void => {
    listeners.delete(listener)
  }
}

/**
 * Adds a query to recent searches, deduping and trimming the list.
 *
 * @param query Search query to remember.
 */
export function addRecentSearch(query: string): void {
  if (typeof window === 'undefined') return
  ensureHydrated()
  const trimmed: string = query.trim()
  if (trimmed.length < 2) return

  const next: string[] = [
    trimmed,
    ...snapshot.filter((entry: string): boolean => entry.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, MAX_RECENTS)

  snapshot = next
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  for (const listener of listeners) listener()
}

/**
 * Removes one entry from recent searches.
 *
 * @param query Query to remove.
 */
export function removeRecentSearch(query: string): void {
  if (typeof window === 'undefined') return
  ensureHydrated()
  snapshot = snapshot.filter((entry: string): boolean => entry !== query)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  for (const listener of listeners) listener()
}

/**
 * Clears all recent searches.
 */
export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return
  ensureHydrated()
  snapshot = []
  window.localStorage.removeItem(STORAGE_KEY)
  for (const listener of listeners) listener()
}
