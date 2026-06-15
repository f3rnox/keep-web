'use client'

import { useEffect } from 'react'
import { useShortcuts, matchesShortcut, type ShortcutId } from './keyboardShortcuts'

/**
 * Options for the global keyboard shortcut handler.
 */
export interface AppShortcutsOptions {
  onNewNote: () => void
  onFocusSearch: () => void
  onCloseModal: () => void
  onTogglePin: () => void
  onUndo: () => void
  onRedo: () => void
  onClearSelection: () => void
  modalOpen: boolean
  selectionActive: boolean
}

/**
 * Registers app-level keyboard shortcuts when no text input is focused.
 *
 * @param options Shortcut callbacks and modal state.
 */
export function useAppShortcuts(options: AppShortcutsOptions): void {
  const shortcuts = useShortcuts()

  const {
    onNewNote,
    onFocusSearch,
    onCloseModal,
    onTogglePin,
    onUndo,
    onRedo,
    onClearSelection,
    modalOpen,
    selectionActive,
  } = options

  useEffect((): (() => void) => {
    const getKeys = (id: ShortcutId): ReadonlyArray<string> => {
      const s = shortcuts.find((item) => item.id === id)
      return s ? s.keys : []
    };

    const handler = (event: KeyboardEvent): void => {
      const target: EventTarget | null = event.target
      const tag: string =
        target instanceof HTMLElement ? target.tagName.toLowerCase() : ''
      const isTyping: boolean =
        tag === 'input' ||
        tag === 'textarea' ||
        (target instanceof HTMLElement && target.isContentEditable)

      if (matchesShortcut(event, getKeys('close-modal-exit-selection'))) {
        if (selectionActive) {
          event.preventDefault()
          onClearSelection()
          return
        }
        if (modalOpen) {
          event.preventDefault()
          onCloseModal()
        }
        return
      }

      if (isTyping) return

      if (matchesShortcut(event, getKeys('redo'))) {
        event.preventDefault()
        onRedo()
        return
      }

      if (matchesShortcut(event, getKeys('undo'))) {
        event.preventDefault()
        onUndo()
        return
      }

      if (matchesShortcut(event, getKeys('new-note'))) {
        event.preventDefault()
        onNewNote()
        return
      }

      if (matchesShortcut(event, getKeys('focus-search'))) {
        event.preventDefault()
        onFocusSearch()
        return
      }

      if (modalOpen && matchesShortcut(event, getKeys('toggle-pin'))) {
        event.preventDefault()
        onTogglePin()
      }
    }

    document.addEventListener('keydown', handler)
    return (): void => document.removeEventListener('keydown', handler)
  }, [
    onNewNote,
    onFocusSearch,
    onCloseModal,
    onTogglePin,
    onUndo,
    onRedo,
    onClearSelection,
    modalOpen,
    selectionActive,
    shortcuts,
  ])
}
