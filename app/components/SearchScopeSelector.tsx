'use client'

import type { JSX } from 'react'
import type { SearchScope } from '../lib/types'

/**
 * Props for the search scope selector.
 */
export interface SearchScopeSelectorProps {
  scope: SearchScope
  inList: boolean
  onChange: (next: SearchScope) => void
}

const BASE_OPTIONS: ReadonlyArray<{ value: SearchScope; label: string }> = [
  { value: 'view', label: 'Current view' },
  { value: 'all', label: 'All notes' },
  { value: 'archive', label: 'Archive' },
  { value: 'trash', label: 'Trash' },
]

/**
 * Dropdown for choosing which note collections search covers.
 */
export function SearchScopeSelector({
  scope,
  inList,
  onChange,
}: SearchScopeSelectorProps): JSX.Element {
  const options: ReadonlyArray<{ value: SearchScope; label: string }> = inList
    ? [
        { value: 'view', label: 'Current view' },
        { value: 'list', label: 'This list' },
        { value: 'all', label: 'All notes' },
        { value: 'archive', label: 'Archive' },
        { value: 'trash', label: 'Trash' },
      ]
    : BASE_OPTIONS

  return (
    <label className='flex items-center gap-2 text-xs text-muted'>
      <span className='hidden sm:inline'>In</span>
      <select
        value={scope}
        onChange={(event): void => onChange(event.target.value as SearchScope)}
        className='rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
        aria-label='Search scope'
      >
        {options.map(
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
