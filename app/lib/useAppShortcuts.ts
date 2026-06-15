'use client'

import { useEffect } from 'react'

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
    const handler = (event: KeyboardEvent): void => {
      const target: EventTarget | null = event.target
      const tag: string =
        target instanceof HTMLElement ? target.tagName.toLowerCase() : ''
      const isTyping: boolean =
        tag === 'input' ||
        tag === 'textarea' ||
        (target instanceof HTMLElement && target.isContentEditable)

      const mod: boolean = event.metaKey || event.ctrlKey

      if (event.key === 'Escape') {
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

      if (mod && event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault()
        onRedo()
        return
      }

      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        onUndo()
        return
      }

      if (event.key === 'n' && !mod && !event.altKey) {
        event.preventDefault()
        onNewNote()
        return
      }

      if (event.key === '/' && !mod && !event.altKey) {
        event.preventDefault()
        onFocusSearch()
        return
      }

      if (modalOpen && event.key === 'p' && !mod && !event.altKey) {
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
  ])
}
