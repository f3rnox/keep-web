'use client'

import type { JSX } from 'react'
import type { NoteList } from '../lib/types'
import { InlineRename } from './InlineRename'

/**
 * Props for the list detail header.
 */
export interface ListDetailHeaderProps {
  list: NoteList
  onRename: (id: string, name: string) => void
}

/**
 * Header shown when viewing notes inside a single list.
 */
export function ListDetailHeader({ list, onRename }: ListDetailHeaderProps): JSX.Element {
  return (
    <div className='mb-8'>
      <InlineRename
        value={list.name}
        onSave={(name: string): void => onRename(list.id, name)}
        className='text-lg font-semibold tracking-tight text-foreground'
        inputClassName='rounded bg-surface-hover px-2 py-1 text-lg font-semibold outline-none'
      />
    </div>
  )
}
