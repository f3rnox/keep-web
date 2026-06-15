'use client'

import { useSyncExternalStore } from 'react'
import { showSettingSaved } from './settingToastStore'

export type ShortcutId =
  | 'new-note'
  | 'focus-search'
  | 'close-modal-exit-selection'
  | 'toggle-pin'
  | 'undo'
  | 'redo'

/**
 * One keyboard shortcut entry for the settings reference page.
 */
export interface KeyboardShortcut {
  id: ShortcutId
  keys: ReadonlyArray<string>
  description: string
  context?: string
}

/**
 * App-wide default keyboard shortcuts.
 */
export const DEFAULT_KEYBOARD_SHORTCUTS: ReadonlyArray<KeyboardShortcut> = [
  { id: 'new-note', keys: ['N'], description: 'Create a new note' },
  { id: 'focus-search', keys: ['/'], description: 'Focus the search field' },
  { id: 'close-modal-exit-selection', keys: ['Esc'], description: 'Close the note editor or exit selection mode' },
  { id: 'toggle-pin', keys: ['P'], description: 'Toggle pin on the open note', context: 'Note editor' },
  { id: 'undo', keys: ['Ctrl', 'Z'], description: 'Undo the last change' },
  { id: 'redo', keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo the last undone change' },
]

const STORAGE_KEY = 'keepspark:shortcuts:v1'

let snapshot: ReadonlyArray<KeyboardShortcut> = DEFAULT_KEYBOARD_SHORTCUTS
let hydrated = false
const listeners: Set<() => void> = new Set()

function ensureHydrated(): void {
  if (hydrated) return
  if (globalThis.window === undefined) return

  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw) as Record<string, string[]>
      if (parsed && typeof parsed === 'object') {
        snapshot = DEFAULT_KEYBOARD_SHORTCUTS.map((shortcut) => {
          if (parsed[shortcut.id] && Array.isArray(parsed[shortcut.id])) {
            return {
              ...shortcut,
              keys: parsed[shortcut.id],
            }
          }
          return shortcut
        })
      }
    }
  } catch {
    // Ignore errors, fallback to default
  }

  hydrated = true
}

export function getShortcutsSnapshot(): ReadonlyArray<KeyboardShortcut> {
  ensureHydrated()
  return snapshot
}

export function getShortcutsServerSnapshot(): ReadonlyArray<KeyboardShortcut> {
  return DEFAULT_KEYBOARD_SHORTCUTS
}

export function subscribeShortcuts(listener: () => void): () => void {
  listeners.add(listener)
  return (): void => {
    listeners.delete(listener)
  }
}

export function setShortcutKeys(id: ShortcutId, keys: ReadonlyArray<string>): void {
  if (globalThis.window === undefined) return
  ensureHydrated()

  // Update snapshot
  snapshot = snapshot.map((shortcut) => {
    if (shortcut.id === id) {
      return { ...shortcut, keys }
    }
    return shortcut
  })

  // Save to localStorage
  try {
    const customMap: Record<string, ReadonlyArray<string>> = {}
    snapshot.forEach((s) => {
      customMap[s.id] = s.keys
    })
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(customMap))
  } catch {
    // Ignore error
  }

  // Notify listeners
  for (const listener of listeners) {
    listener()
  }

  showSettingSaved('Shortcut updated')
}

export function resetShortcuts(): void {
  if (globalThis.window === undefined) return
  ensureHydrated()

  snapshot = DEFAULT_KEYBOARD_SHORTCUTS
  globalThis.localStorage.removeItem(STORAGE_KEY)

  for (const listener of listeners) {
    listener()
  }

  showSettingSaved('Shortcuts reset to default')
}

export function useShortcuts(): ReadonlyArray<KeyboardShortcut> {
  return useSyncExternalStore(
    subscribeShortcuts,
    getShortcutsSnapshot,
    getShortcutsServerSnapshot,
  )
}

/**
 * Checks if a KeyboardEvent matches a given keys configuration.
 */
export function matchesShortcut(event: KeyboardEvent, keys: ReadonlyArray<string>): boolean {
  const hasCtrl = keys.includes('Ctrl')
  const hasShift = keys.includes('Shift')
  const hasAlt = keys.includes('Alt')

  const eventCtrl = event.ctrlKey || event.metaKey
  const eventShift = event.shiftKey
  const eventAlt = event.altKey

  if (eventCtrl !== hasCtrl) return false
  if (eventShift !== hasShift) return false
  if (eventAlt !== hasAlt) return false

  // Find the non-modifier key in keys
  const mainKey = keys.find((k) => k !== 'Ctrl' && k !== 'Shift' && k !== 'Alt')
  if (!mainKey) return false

  const eventKey = event.key

  // Normalize event key to compare with mainKey
  let normalizedEventKey = eventKey
  if (eventKey === 'Escape') {
    normalizedEventKey = 'Esc'
  } else if (eventKey === ' ') {
    normalizedEventKey = 'Space'
  }

  // Compare case-insensitively
  return normalizedEventKey.toLowerCase() === mainKey.toLowerCase()
}

