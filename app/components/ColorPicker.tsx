'use client'

import type { JSX } from 'react'
import type { NoteColor } from '../lib/types'
import { NOTE_COLOR_LABELS, NOTE_COLOR_ORDER, getNoteColorClasses } from '../lib/colors'
import { Icon } from './Icon'

/**
 * Props for the `ColorPicker` swatch row.
 */
export interface ColorPickerProps {
  value: NoteColor
  onChange: (next: NoteColor) => void
  className?: string
}

/**
 * Inline row of circular color swatches. Renders the entire `NoteColor`
 * palette and surfaces the active selection with a check mark overlay.
 *
 * @param props.value The currently selected color token.
 * @param props.onChange Invoked when a swatch is clicked.
 * @param props.className Optional extra classes applied to the wrapper.
 */
export function ColorPicker({ value, onChange, className = '' }: ColorPickerProps): JSX.Element {
  return (
    <div
      role='radiogroup'
      aria-label='Note color'
      className={`flex flex-wrap items-center gap-1 ${className}`.trim()}
    >
      {NOTE_COLOR_ORDER.map((color: NoteColor): JSX.Element => {
        const classes = getNoteColorClasses(color)
        const selected: boolean = color === value
        return (
          <button
            key={color}
            type='button'
            role='radio'
            aria-checked={selected}
            aria-label={NOTE_COLOR_LABELS[color]}
            title={NOTE_COLOR_LABELS[color]}
            onClick={(): void => onChange(color)}
            className={`relative h-7 w-7 rounded-full ring-1 ring-black/10 transition hover:scale-110 dark:ring-white/15 ${classes.swatch} ${
              selected ? 'outline outline-2 outline-amber-500' : ''
            }`}
          >
            {selected ? (
              <span className='pointer-events-none absolute inset-0 flex items-center justify-center text-neutral-800 dark:text-neutral-100'>
                <Icon name='check' size={14} />
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
