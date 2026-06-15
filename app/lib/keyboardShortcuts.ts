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
  | 'search-commit'
  | 'search-dismiss'
  | 'open-note-enter'
  | 'open-note-space'
  | 'format-bold'
  | 'format-italic'
  | 'format-h1'
  | 'format-h2'
  | 'format-h3'
  | 'cancel-compose'
  | 'label-add'
  | 'label-remove-last'
  | 'rename-confirm'
  | 'rename-cancel'
  | 'list-create'
  | 'dialog-cancel'

/**
 * One keyboard shortcut entry for the settings reference page.
 */
export interface KeyboardShortcut {
  id: ShortcutId
  keys: ReadonlyArray<string>
  description: string
  context?: string
  customizable?: boolean
}

/**
 * App-wide default keyboard shortcuts.
 */
export const DEFAULT_KEYBOARD_SHORTCUTS: ReadonlyArray<KeyboardShortcut> = [
  { id: 'new-note', keys: ['N'], description: 'Create a new note', customizable: true },
  { id: 'focus-search', keys: ['/'], description: 'Focus the search field', customizable: true },
  { id: 'undo', keys: ['Ctrl', 'Z'], description: 'Undo the last change', customizable: true },
  { id: 'redo', keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo the last undone change', customizable: true },
  {
    id: 'close-modal-exit-selection',
    keys: ['Esc'],
    description: 'Close the note editor or exit selection mode',
    customizable: true,
  },
  {
    id: 'toggle-pin',
    keys: ['P'],
    description: 'Toggle pin on the open note',
    context: 'Note editor',
    customizable: true,
  },
  {
    id: 'search-commit',
    keys: ['Enter'],
    description: 'Run search',
    context: 'Search field',
  },
  {
    id: 'search-dismiss',
    keys: ['Esc'],
    description: 'Close search suggestions',
    context: 'Search field',
  },
  {
    id: 'open-note-enter',
    keys: ['Enter'],
    description: 'Open note',
    context: 'Note list',
  },
  {
    id: 'open-note-space',
    keys: ['Space'],
    description: 'Open note',
    context: 'Note list',
  },
  {
    id: 'format-bold',
    keys: ['Ctrl', 'B'],
    description: 'Apply bold formatting',
    context: 'Note content',
  },
  {
    id: 'format-italic',
    keys: ['Ctrl', 'I'],
    description: 'Apply italic formatting',
    context: 'Note content',
  },
  {
    id: 'format-h1',
    keys: ['Ctrl', 'Alt', '1'],
    description: 'Apply heading 1',
    context: 'Note content. Ctrl+Shift+1 also works.',
  },
  {
    id: 'format-h2',
    keys: ['Ctrl', 'Alt', '2'],
    description: 'Apply heading 2',
    context: 'Note content. Ctrl+Shift+2 also works.',
  },
  {
    id: 'format-h3',
    keys: ['Ctrl', 'Alt', '3'],
    description: 'Apply heading 3',
    context: 'Note content. Ctrl+Shift+3 also works.',
  },
  {
    id: 'cancel-compose',
    keys: ['Esc'],
    description: 'Discard unsaved new note',
    context: 'New note panel',
  },
  {
    id: 'label-add',
    keys: ['Enter'],
    description: 'Add label',
    context: 'Label input',
  },
  {
    id: 'label-remove-last',
    keys: ['Backspace'],
    description: 'Remove last label',
    context: 'Label input when empty',
  },
  {
    id: 'rename-confirm',
    keys: ['Enter'],
    description: 'Save rename',
    context: 'Inline rename',
  },
  {
    id: 'rename-cancel',
    keys: ['Esc'],
    description: 'Cancel rename',
    context: 'Inline rename',
  },
  {
    id: 'list-create',
    keys: ['Enter'],
    description: 'Create list from typed name',
    context: 'List picker',
  },
  {
    id: 'dialog-cancel',
    keys: ['Esc'],
    description: 'Cancel or close',
    context: 'Confirm and password dialogs',
  },
]

const STORAGE_KEY = 'keepspark:shortcuts:v1'

let snapshot: ReadonlyArray<KeyboardShortcut> = DEFAULT_KEYBOARD_SHORTCUTS
let storageHydrated = false
const listeners: Set<() => void> = new Set()

function hydrateShortcutsFromStorage(): void {
  if (storageHydrated) return
  if (globalThis.window === undefined) return

  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw) as Record<string, string[]>
      if (parsed && typeof parsed === 'object') {
        snapshot = DEFAULT_KEYBOARD_SHORTCUTS.map((shortcut) => {
          if (shortcut.customizable === false) return shortcut
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

  storageHydrated = true
}

function ensureHydrated(): void {
  hydrateShortcutsFromStorage()
}

function notifyShortcutListeners(): void {
  for (const listener of listeners) {
    listener()
  }
}

export function getShortcutsSnapshot(): ReadonlyArray<KeyboardShortcut> {
  if (!storageHydrated) {
    return DEFAULT_KEYBOARD_SHORTCUTS
  }
  return snapshot
}

export function getShortcutsServerSnapshot(): ReadonlyArray<KeyboardShortcut> {
  return DEFAULT_KEYBOARD_SHORTCUTS
}

export function subscribeShortcuts(listener: () => void): () => void {
  listeners.add(listener)

  if (globalThis.window !== undefined && !storageHydrated) {
    queueMicrotask((): void => {
      if (storageHydrated) return
      hydrateShortcutsFromStorage()
      notifyShortcutListeners()
    })
  }

  return (): void => {
    listeners.delete(listener)
  }
}

export function setShortcutKeys(id: ShortcutId, keys: ReadonlyArray<string>): void {
  if (globalThis.window === undefined) return
  ensureHydrated()

  const existing = snapshot.find((shortcut) => shortcut.id === id)
  if (existing?.customizable === false) return

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
      if (s.customizable !== false) {
        customMap[s.id] = s.keys
      }
    })
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(customMap))
  } catch {
    // Ignore error
  }

  // Notify listeners
  notifyShortcutListeners()

  showSettingSaved('Shortcut updated')
}

export function resetShortcuts(): void {
  if (globalThis.window === undefined) return
  ensureHydrated()

  snapshot = DEFAULT_KEYBOARD_SHORTCUTS
  globalThis.localStorage.removeItem(STORAGE_KEY)

  notifyShortcutListeners()

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

