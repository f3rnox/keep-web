const STORAGE_KEY: string = 'keepspark:tasks-section-collapsed'

let snapshot: boolean = false
let hydrated: boolean = false
const listeners: Set<() => void> = new Set()

const SERVER_SNAPSHOT: boolean = false

function ensureHydrated(): void {
  if (hydrated) return
  if (typeof window === 'undefined') return

  try {
    const raw: string | null = window.localStorage.getItem(STORAGE_KEY)
    if (raw === 'true') snapshot = true
    else if (raw === 'false') snapshot = false
  } catch {
    snapshot = false
  }

  hydrated = true
}

/**
 * Returns whether the tasks section is collapsed.
 */
export function getTasksSectionCollapsedSnapshot(): boolean {
  ensureHydrated()
  return snapshot
}

/**
 * Returns the server-side collapsed snapshot used during SSR.
 */
export function getTasksSectionCollapsedServerSnapshot(): boolean {
  return SERVER_SNAPSHOT
}

/**
 * Registers a subscriber invoked whenever the tasks section collapsed state changes.
 *
 * @param listener Callback invoked on every snapshot update.
 */
export function subscribeTasksSectionCollapsed(listener: () => void): () => void {
  listeners.add(listener)
  return (): void => {
    listeners.delete(listener)
  }
}

/**
 * Updates whether the tasks section is collapsed and persists the preference.
 *
 * @param collapsed When true, the tasks section body is hidden.
 */
export function setTasksSectionCollapsed(collapsed: boolean): void {
  if (typeof window === 'undefined') return
  ensureHydrated()
  if (collapsed === snapshot) return
  snapshot = collapsed

  try {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed))
  } catch {
    /* ignore quota / privacy errors */
  }

  for (const listener of listeners) listener()
}
