'use client'

import { useEffect, useRef, useState, type JSX } from 'react'
import type { Note, NoteColor, NoteView } from '../lib/types'
import { getNoteColorClasses } from '../lib/colors'
import { ColorPicker } from './ColorPicker'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

/**
 * Props for an individual `NoteCard` rendered inside the grid.
 */
export interface NoteCardProps {
  note: Note
  view: NoteView
  onOpen: (note: Note) => void
  onTogglePinned: (id: string) => void
  onSetArchived: (id: string, archived: boolean) => void
  onSetTrashed: (id: string, trashed: boolean) => void
  onDeleteForever: (id: string) => void
  onChangeColor: (id: string, color: NoteColor) => void
}

/**
 * Single note tile rendered inside the masonry grid. Handles color, pin,
 * archive, trash, restore, and delete-forever interactions, surfacing the
 * action set appropriate for the current `view`.
 */
export function NoteCard({
  note,
  view,
  onOpen,
  onTogglePinned,
  onSetArchived,
  onSetTrashed,
  onDeleteForever,
  onChangeColor,
}: NoteCardProps): JSX.Element {
  const [showPalette, setShowPalette] = useState<boolean>(false)
  const paletteRef = useRef<HTMLDivElement | null>(null)
  const classes = getNoteColorClasses(note.color)

  useEffect((): (() => void) | void => {
    if (!showPalette) return
    const handler = (event: MouseEvent): void => {
      if (!paletteRef.current) return
      if (event.target instanceof Node && paletteRef.current.contains(event.target)) return
      setShowPalette(false)
    }
    document.addEventListener('mousedown', handler)
    return (): void => document.removeEventListener('mousedown', handler)
  }, [showPalette])

  const isTrash: boolean = view === 'trash'

  return (
    <article
      className={`group mb-4 break-inside-avoid rounded-lg border ${classes.bg} ${classes.hoverBg} ${classes.border} text-neutral-800 shadow-sm transition hover:shadow-md dark:text-neutral-100`}
    >
      <button
        type='button'
        onClick={(): void => {
          if (isTrash) return
          onOpen(note)
        }}
        className='block w-full cursor-text text-left'
        disabled={isTrash}
      >
        <div className='flex items-start justify-between gap-2 px-4 pt-3'>
          {note.title.length > 0 ? (
            <h3 className='line-clamp-3 break-words text-base font-medium'>{note.title}</h3>
          ) : (
            <span className='sr-only'>Untitled note</span>
          )}
          {!isTrash ? (
            <span
              role='button'
              tabIndex={0}
              aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
              title={note.pinned ? 'Unpin note' : 'Pin note'}
              onClick={(event): void => {
                event.stopPropagation()
                onTogglePinned(note.id)
              }}
              onKeyDown={(event): void => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                event.stopPropagation()
                onTogglePinned(note.id)
              }}
              className='-mt-1 -mr-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-neutral-500 transition-opacity hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-neutral-300 dark:hover:bg-white/10'
            >
              <Icon name={note.pinned ? 'pinFilled' : 'pin'} size={18} />
            </span>
          ) : null}
        </div>
        {note.content.length > 0 ? (
          <p className='whitespace-pre-wrap break-words px-4 py-2 text-sm leading-relaxed text-neutral-800/90 dark:text-neutral-100/90'>
            {note.content}
          </p>
        ) : (
          <div className='h-2' />
        )}
      </button>

      <div
        className='flex items-center justify-between px-2 pb-2 pt-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'
      >
        {isTrash ? (
          <div className='flex items-center gap-1'>
            <IconButton
              label='Restore note'
              onClick={(): void => onSetTrashed(note.id, false)}
            >
              <Icon name='restore' size={18} />
            </IconButton>
            <IconButton
              label='Delete forever'
              onClick={(): void => onDeleteForever(note.id)}
            >
              <Icon name='deleteForever' size={18} />
            </IconButton>
          </div>
        ) : (
          <div className='relative flex items-center gap-1' ref={paletteRef}>
            <IconButton
              label='Background options'
              active={showPalette}
              onClick={(event): void => {
                event.stopPropagation()
                setShowPalette((prev: boolean): boolean => !prev)
              }}
            >
              <Icon name='palette' size={18} />
            </IconButton>
            <IconButton
              label={note.archived ? 'Unarchive' : 'Archive'}
              onClick={(event): void => {
                event.stopPropagation()
                onSetArchived(note.id, !note.archived)
              }}
            >
              <Icon name={note.archived ? 'unarchive' : 'archive'} size={18} />
            </IconButton>
            <IconButton
              label='Move to trash'
              onClick={(event): void => {
                event.stopPropagation()
                onSetTrashed(note.id, true)
              }}
            >
              <Icon name='trash' size={18} />
            </IconButton>
            {showPalette ? (
              <div className='absolute bottom-10 left-0 z-10 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900'>
                <ColorPicker
                  value={note.color}
                  onChange={(next: NoteColor): void => onChangeColor(note.id, next)}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </article>
  )
}
