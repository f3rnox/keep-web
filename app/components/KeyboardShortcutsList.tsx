'use client'

import { useState, useEffect, useCallback, useMemo, type JSX } from 'react'
import { useShortcuts, setShortcutKeys, type ShortcutId, type KeyboardShortcut } from '../lib/keyboardShortcuts'
import { Icon } from './Icon'

/**
 * Props for the keyboard shortcuts reference list.
 */
export interface KeyboardShortcutsListProps {
  filterQuery?: string
}

function shortcutMatchesFilter(shortcut: KeyboardShortcut, query: string): boolean {
  const normalized: string = query.trim().toLowerCase()
  if (normalized.length === 0) return true

  const label: string = [
    shortcut.description,
    shortcut.context ?? '',
    ...shortcut.keys,
  ]
    .join(' ')
    .toLowerCase()

  return label.includes(normalized)
}

function parseModifiers(event: KeyboardEvent): string[] {
  const keys: string[] = []
  if (event.ctrlKey || event.metaKey) {
    keys.push('Ctrl')
  }
  if (event.shiftKey) {
    keys.push('Shift')
  }
  if (event.altKey) {
    keys.push('Alt')
  }
  return keys
}

function getKeyLabel(key: string): string {
  if (key === 'Escape') {
    return 'Esc'
  }
  if (key === ' ') {
    return 'Space'
  }
  if (key.length === 1) {
    return key.toUpperCase()
  }
  if (key.startsWith('Arrow')) {
    return key.slice(5) // e.g., Up, Down, Left, Right
  }
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/**
 * Renders the keyboard shortcut reference rows with interactive configuration capability.
 *
 * @param props.filterQuery Optional text used to filter shortcuts by label, context, or keys.
 */
export function KeyboardShortcutsList({ filterQuery = '' }: KeyboardShortcutsListProps): JSX.Element {
  const shortcuts = useShortcuts()
  const visibleShortcuts = useMemo(
    (): ReadonlyArray<KeyboardShortcut> =>
      shortcuts.filter((shortcut: KeyboardShortcut): boolean =>
        shortcutMatchesFilter(shortcut, filterQuery),
      ),
    [shortcuts, filterQuery],
  )
  const [recordingId, setRecordingId] = useState<ShortcutId | null>(null)
  const [pressedModifiers, setPressedModifiers] = useState<string[]>([])

  const handleRowClick = useCallback((shortcut: KeyboardShortcut) => {
    if (shortcut.customizable === false) return
    if (recordingId === shortcut.id) {
      setRecordingId(null)
      setPressedModifiers([])
    } else {
      setRecordingId(shortcut.id)
      setPressedModifiers([])
    }
  }, [recordingId])

  useEffect(() => {
    if (recordingId === null) return

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Prevent default browser action while recording (e.g., closing modal, reloading page)
      event.preventDefault()
      event.stopPropagation()

      const keys = parseModifiers(event)
      const key = event.key
      const isModifier = ['Control', 'Shift', 'Alt', 'Meta'].includes(key)

      if (isModifier) {
        setPressedModifiers(keys)
        return
      }

      const mainKey = getKeyLabel(key)
      if (!keys.includes(mainKey)) {
        keys.push(mainKey)
      }

      // Auto-confirm and save
      setShortcutKeys(recordingId, keys)
      setRecordingId(null)
      setPressedModifiers([])
    }

    const handleGlobalKeyUp = (event: KeyboardEvent) => {
      const tempMods: string[] = []
      if (event.ctrlKey || event.metaKey) tempMods.push('Ctrl')
      if (event.shiftKey) tempMods.push('Shift')
      if (event.altKey) tempMods.push('Alt')
      setPressedModifiers(tempMods)
    }

    const handleMousedownOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-shortcut-row]')) {
        setRecordingId(null)
        setPressedModifiers([])
      }
    }

    globalThis.addEventListener('keydown', handleGlobalKeyDown, true)
    globalThis.addEventListener('keyup', handleGlobalKeyUp, true)
    globalThis.addEventListener('mousedown', handleMousedownOutside)

    return () => {
      globalThis.removeEventListener('keydown', handleGlobalKeyDown, true)
      globalThis.removeEventListener('keyup', handleGlobalKeyUp, true)
      globalThis.removeEventListener('mousedown', handleMousedownOutside)
    }
  }, [recordingId])

  return (
    <ul className='divide-y divide-border'>
      {visibleShortcuts.length === 0 ? (
        <li className='px-4 py-6 text-sm text-muted'>No shortcuts match your filter.</li>
      ) : null}
      {visibleShortcuts.map((shortcut: KeyboardShortcut): JSX.Element => {
        const isRecording = recordingId === shortcut.id
        const isCustomizable = shortcut.customizable !== false
        const rowClassName = `group w-full text-left flex flex-row items-start justify-between gap-3 px-4 py-3 transition-colors select-none ${
          isCustomizable
            ? `cursor-pointer focus:outline-none focus:bg-surface-hover/30 ${
                isRecording
                  ? 'bg-primary/5 hover:bg-primary/10'
                  : 'hover:bg-surface-hover/50'
              }`
            : ''
        }`

        const rowContent = (
          <>
            <div className='min-w-0 flex-1 space-y-0.5'>
              <div className='flex items-center gap-2'>
                <p className='text-sm font-medium text-foreground'>{shortcut.description}</p>
                {isCustomizable && !isRecording ? (
                  <Icon
                    name='edit'
                    size={14}
                    className='shrink-0 text-muted opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity'
                  />
                ) : null}
              </div>
              {shortcut.context ? (
                <p className='text-xs text-muted'>{shortcut.context}</p>
              ) : null}
            </div>

            <div className='flex shrink-0 flex-nowrap items-center gap-1.5 self-center'>
              {isRecording ? (
                <>
                  <span className='animate-pulse text-xs text-primary font-medium mr-1'>
                    Recording...
                  </span>
                  {pressedModifiers.length > 0 ? (
                    <>
                      {pressedModifiers.map((mod) => (
                        <kbd
                          key={mod}
                          className='rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary shadow-sm'
                        >
                          {mod}
                        </kbd>
                      ))}
                      <span className='text-xs text-primary/60 font-bold'>+</span>
                      <span className='text-xs text-primary/70 italic animate-pulse bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10'>
                        press key
                      </span>
                    </>
                  ) : (
                    <span className='text-xs text-muted italic bg-muted/10 px-2 py-1 rounded border border-border/40 animate-pulse'>
                      Press key combination
                    </span>
                  )}
                </>
              ) : (
                <>
                  {isCustomizable ? (
                    <span className='text-xs text-muted/60 opacity-0 group-hover:opacity-100 transition-opacity mr-1.5 hidden sm:inline'>
                      Click to customize
                    </span>
                  ) : null}
                  {shortcut.keys.map((key: string): JSX.Element => (
                    <kbd
                      key={`${shortcut.id}-${key}`}
                      className='rounded-md border border-border bg-canvas px-2 py-1 text-xs font-medium text-foreground shadow-sm group-hover:border-border/80 group-hover:bg-canvas/80'
                    >
                      {key}
                    </kbd>
                  ))}
                </>
              )}
            </div>
          </>
        )

        return (
          <li key={shortcut.id} data-shortcut-row={shortcut.id}>
            {isCustomizable ? (
              <button
                type='button'
                onClick={(): void => handleRowClick(shortcut)}
                className={rowClassName}
              >
                {rowContent}
              </button>
            ) : (
              <div className={rowClassName}>{rowContent}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
