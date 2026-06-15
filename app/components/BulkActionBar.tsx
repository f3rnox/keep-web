'use client'

import type { JSX } from 'react'
import type { NoteColor, NoteList } from '../lib/types'
import { ColorPicker } from './ColorPicker'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { ListPicker } from './ListPicker'

/**
 * Props for the bulk action bar shown when notes are selected.
 */
export interface BulkActionBarProps {
  count: number
  lists: ReadonlyArray<NoteList>
  view: 'notes' | 'lists' | 'archive' | 'trash'
  onClear: () => void
  onArchive: () => void
  onTrash: () => void
  onRestore: () => void
  onDeleteForever: () => void
  onMoveToList: (listId: string | null) => void
  onChangeColor: (color: NoteColor) => void
  onCreateList?: (name: string) => NoteList | null
}

/**
 * Floating bar for applying actions to multiple selected notes at once.
 */
export function BulkActionBar({
  count,
  lists,
  view,
  onClear,
  onArchive,
  onTrash,
  onRestore,
  onDeleteForever,
  onMoveToList,
  onChangeColor,
  onCreateList,
}: BulkActionBarProps): JSX.Element | null {
  if (count === 0) return null

  return (
    <div className='fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-xl shadow-black/10'>
      <span className='text-sm font-medium text-foreground'>{count} selected</span>
      <div className='h-4 w-px bg-border' />
      {view === 'trash' ? (
        <>
          <button
            type='button'
            onClick={onRestore}
            className='rounded-lg px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-hover'
          >
            Restore
          </button>
          <button
            type='button'
            onClick={onDeleteForever}
            className='rounded-lg px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-hover'
          >
            Delete forever
          </button>
        </>
      ) : (
        <>
          <ListPicker
            listId={null}
            lists={lists}
            onChange={onMoveToList}
            onCreateList={onCreateList}
          />
          <div className='rounded-lg border border-border p-1.5'>
            <ColorPicker value='default' onChange={onChangeColor} />
          </div>
          {view !== 'archive' ? (
            <button
              type='button'
              onClick={onArchive}
              className='rounded-lg px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-hover'
            >
              Archive
            </button>
          ) : null}
          <button
            type='button'
            onClick={onTrash}
            className='rounded-lg px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-hover'
          >
            Trash
          </button>
        </>
      )}
      <IconButton label='Clear selection' onClick={onClear}>
        <Icon name='close' size={18} />
      </IconButton>
    </div>
  )
}
