import type { KeyboardEvent } from 'react'
import { applyMarkdownToTextarea } from './applyMarkdownToTextarea'
import { handleChecklistEnter } from './handleChecklistEnter'
import { resolveMarkdownShortcut } from './resolveMarkdownShortcut'

/**
 * Handles markdown formatting keyboard shortcuts on a note content textarea.
 * Returns whether the key event was consumed.
 *
 * @param event Keydown event from the content textarea.
 * @param value Current textarea value.
 * @param onChange Called with the updated markdown string when a shortcut matches.
 */
export function handleMarkdownKeyDown(
  event: KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  onChange: (value: string) => void,
): boolean {
  if (event.key === 'Enter' && !event.shiftKey) {
    const checklistResult = handleChecklistEnter(
      value,
      event.currentTarget.selectionStart,
      event.currentTarget.selectionEnd,
    )
    if (checklistResult !== null) {
      event.preventDefault()
      onChange(checklistResult.value)
      requestAnimationFrame((): void => {
        event.currentTarget.focus()
        event.currentTarget.setSelectionRange(
          checklistResult.selectionStart,
          checklistResult.selectionEnd,
        )
      })
      return true
    }
  }

  const format = resolveMarkdownShortcut(event)
  if (!format) return false

  event.preventDefault()
  applyMarkdownToTextarea(event.currentTarget, value, onChange, format)
  return true
}
