'use client'

import type { JSX } from 'react'
import type { NoteSort } from '../lib/types'

/**
 * Props for the sort selector dropdown.
 */
export interface SortSelectorProps {
  sort: NoteSort
  onChange: (next: NoteSort) => void
}

const SORT_OPTIONS: ReadonlyArray<{ value: NoteSort; label: string }> = [
  { value: 'updated', label: 'Recently edited' },
  { value: 'created', label: 'Date created' },
  { value: 'title', label: 'Title' },
  { value: 'color', label: 'Color' },
  { value: 'due', label: 'Due date' },
  { value: 'custom', label: 'Custom order' },
]

/**
 * Dropdown for choosing how notes are sorted in the current view.
 *
 * @param props.sort Active sort criterion.
 * @param props.onChange Invoked when the user picks a new sort option.
 */
export function SortSelector({ sort, onChange }: SortSelectorProps): JSX.Element {
  return (
    <label className='flex items-center gap-2 text-xs text-muted'>
      <span className='hidden sm:inline'>Sort</span>
      <select
        value={sort}
        onChange={(event): void => onChange(event.target.value as NoteSort)}
        className='rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
        aria-label='Sort notes'
      >
        {SORT_OPTIONS.map(
          (option): JSX.Element => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ),
        )}
      </select>
    </label>
  )
}
