'use client'

import type { ChangeEvent, JSX } from 'react'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

/**
 * Props for the top-level `Header` bar.
 */
export interface HeaderProps {
  query: string
  onQueryChange: (next: string) => void
  onToggleSidebar: () => void
}

/**
 * Sticky application header containing the menu toggle, brand mark, and
 * full-width search field.
 *
 * @param props.query Current search query value.
 * @param props.onQueryChange Invoked whenever the search input changes.
 * @param props.onToggleSidebar Invoked when the user clicks the menu icon.
 */
export function Header({ query, onQueryChange, onToggleSidebar }: HeaderProps): JSX.Element {
  return (
    <header className='sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-neutral-200 bg-white/95 px-2 backdrop-blur sm:px-4 dark:border-neutral-800 dark:bg-neutral-950/95'>
      <IconButton label='Toggle navigation' onClick={onToggleSidebar}>
        <Icon name='menu' />
      </IconButton>

      <div className='flex items-center gap-2 pl-1 pr-2 sm:pr-4'>
        <span className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-300 text-amber-950'>
          <Icon name='lightbulb' size={22} />
        </span>
        <span className='text-xl font-medium tracking-tight text-neutral-700 dark:text-neutral-200'>
          Keep
        </span>
      </div>

      <label className='ml-2 flex max-w-2xl flex-1 items-center gap-3 rounded-lg bg-neutral-100 px-3 py-2 text-neutral-700 transition focus-within:bg-white focus-within:shadow-sm dark:bg-neutral-800 dark:text-neutral-200 dark:focus-within:bg-neutral-700'>
        <Icon name='search' />
        <input
          type='search'
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>): void =>
            onQueryChange(event.target.value)
          }
          placeholder='Search'
          className='w-full bg-transparent text-base outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-400'
        />
      </label>
    </header>
  )
}
