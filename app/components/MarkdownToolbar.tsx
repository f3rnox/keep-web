'use client'

import { useCallback, type JSX, type RefObject } from 'react'
import { applyMarkdownToTextarea } from '../lib/applyMarkdownToTextarea'
import type { MarkdownFormat } from '../lib/applyMarkdownFormat'
import { Icon } from './Icon'

/**
 * Props for the markdown formatting toolbar.
 */
export interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (value: string) => void
}

const TEXT_BUTTONS: ReadonlyArray<{ format: MarkdownFormat; label: string; display: string }> = [
  { format: 'bold', label: 'Bold', display: 'B' },
  { format: 'italic', label: 'Italic', display: 'I' },
  { format: 'h1', label: 'Heading 1', display: 'H1' },
  { format: 'h2', label: 'Heading 2', display: 'H2' },
  { format: 'h3', label: 'Heading 3', display: 'H3' },
]

/**
 * Toolbar with buttons that insert markdown formatting around the textarea
 * selection (bold, italic, headings, and checklist items).
 *
 * @param props.textareaRef Ref to the content textarea being edited.
 * @param props.value Current textarea value.
 * @param props.onChange Called with the updated value after formatting.
 */
export function MarkdownToolbar({
  textareaRef,
  value,
  onChange,
}: MarkdownToolbarProps): JSX.Element {
  const apply = useCallback(
    (format: MarkdownFormat): void => {
      const textarea: HTMLTextAreaElement | null = textareaRef.current
      if (!textarea) return
      applyMarkdownToTextarea(textarea, value, onChange, format)
    },
    [textareaRef, value, onChange],
  )

  return (
    <div
      role='toolbar'
      aria-label='Formatting'
      className='flex flex-wrap items-center gap-0.5 border-b border-border/60 pb-2'
    >
      {TEXT_BUTTONS.map(
        (button: { format: MarkdownFormat; label: string; display: string }): JSX.Element => (
          <button
            key={button.format}
            type='button'
            aria-label={button.label}
            title={button.label}
            onMouseDown={(event): void => event.preventDefault()}
            onClick={(): void => apply(button.format)}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              button.format === 'italic' ? 'italic' : ''
            }`}
          >
            {button.display}
          </button>
        ),
      )}
      <button
        type='button'
        aria-label='Checklist'
        title='Checklist'
        onMouseDown={(event): void => event.preventDefault()}
        onClick={(): void => apply('checklist')}
        className='inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        <Icon name='check' size={16} />
      </button>
    </div>
  )
}
