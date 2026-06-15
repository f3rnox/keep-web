'use client'

import { useEffect, useRef, useState, type DragEvent, type JSX } from 'react'
import type { Note, NoteColor, NoteList, NoteView } from '../lib/types'
import { formatDueDate } from '../lib/formatDueDate'
import { isNoteOverdue } from '../lib/isNoteOverdue'
import { getNoteColorClasses } from '../lib/colors'
import { ColorPicker } from './ColorPicker'
import { HighlightText } from './HighlightText'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { ListPicker } from './ListPicker'
import { NoteContent } from './NoteContent'

/**
 * Props for an individual `NoteCard` rendered inside the grid.
 */
export interface NoteCardProps {
  note: Note
  view: NoteView
  lists: ReadonlyArray<NoteList>
  listName?: string | null
  searchQuery?: string
  selected?: boolean
  selectionActive?: boolean
  draggable?: boolean
  onOpen: (note: Note) => void
  onToggleSelect?: (id: string) => void
  onTogglePinned: (id: string) => void
  onSetArchived: (id: string, archived: boolean) => void
  onSetTrashed: (id: string, trashed: boolean) => void
  onDeleteForever: (id: string) => void
  onChangeColor: (id: string, color: NoteColor) => void
  onSetListId: (id: string, listId: string | null) => void
  onCreateList?: (name: string) => NoteList | null
  onContentChange?: (id: string, content: string) => void
  onLabelClick?: (label: string) => void
  onNoteLinkClick?: (title: string) => void
  onDragStart?: (id: string) => void
  onDragOver?: (id: string) => void
  onDrop?: (id: string) => void
}

/**
 * Single note tile rendered inside the masonry grid.
 */
export function NoteCard({
  note,
  view,
  lists,
  listName = null,
  searchQuery = '',
  selected = false,
  selectionActive = false,
  draggable = false,
  onOpen,
  onToggleSelect,
  onTogglePinned,
  onSetArchived,
  onSetTrashed,
  onDeleteForever,
  onChangeColor,
  onSetListId,
  onCreateList,
  onContentChange,
  onLabelClick,
  onNoteLinkClick,
  onDragStart,
  onDragOver,
  onDrop,
}: NoteCardProps): JSX.Element {
  const [showPalette, setShowPalette] = useState<boolean>(false)
  const [dragOver, setDragOver] = useState<boolean>(false)
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
  const stripClass: string = classes.strip.length > 0 ? `border-l-4 ${classes.strip}` : ''
  const isOverdue: boolean = isNoteOverdue(note.dueAt) && !note.trashed && !note.archived

  const handleBodyClick = (): void => {
    if (isTrash) return
    if (selectionActive) {
      onToggleSelect?.(note.id)
      return
    }
    onOpen(note)
  }

  return (
    <article
      draggable={draggable && !isTrash && !selectionActive}
      onDragStart={(event: DragEvent<HTMLElement>): void => {
        if (!draggable || isTrash || selectionActive) return
        event.dataTransfer.setData('text/note-id', note.id)
        event.dataTransfer.effectAllowed = 'move'
        onDragStart?.(note.id)
      }}
      onDragOver={(event: DragEvent<HTMLElement>): void => {
        if (!draggable || isTrash || selectionActive) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        setDragOver(true)
        onDragOver?.(note.id)
      }}
      onDragLeave={(): void => setDragOver(false)}
      onDrop={(event: DragEvent<HTMLElement>): void => {
        if (!draggable || isTrash || selectionActive) return
        event.preventDefault()
        setDragOver(false)
        onDrop?.(note.id)
      }}
      className={`group relative rounded-xl border ${selected ? 'border-accent ring-2 ring-accent/30' : 'border-border'} ${classes.tint} ${stripClass} text-foreground transition-colors hover:border-foreground/25 ${
        dragOver ? 'ring-2 ring-accent' : ''
      }`}
    >
      {draggable && !isTrash && !selectionActive ? (
        <span
          className='absolute left-1 top-2 cursor-grab text-muted opacity-0 transition-opacity group-hover:opacity-60'
          aria-hidden='true'
        >
          <Icon name='gripVertical' size={16} />
        </span>
      ) : null}

      <div
        role={isTrash ? undefined : 'button'}
        tabIndex={isTrash ? undefined : 0}
        onClick={handleBodyClick}
        onKeyDown={(event): void => {
          if (isTrash) return
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          handleBodyClick()
        }}
        className={`block w-full text-left ${isTrash ? '' : 'cursor-text'}`}
      >
        <div className='flex gap-2.5 px-4 pt-3.5'>
          {selectionActive || selected ? (
            <label
              className='mt-0.5 flex shrink-0 cursor-pointer items-start'
              onClick={(event): void => event.stopPropagation()}
            >
              <input
                type='checkbox'
                checked={selected}
                onChange={(): void => onToggleSelect?.(note.id)}
                className='h-4 w-4 accent-accent'
                aria-label={`Select ${note.title || 'note'}`}
              />
            </label>
          ) : null}
          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0 flex-1'>
            {listName ? (
              <span className='mb-1 inline-block rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-medium text-muted'>
                {listName}
              </span>
            ) : null}
            {note.dueAt !== null ? (
              <span
                className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  isOverdue
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                    : 'bg-surface-hover text-muted'
                }`}
              >
                <Icon name='lightbulb' size={12} />
                {formatDueDate(note.dueAt)}
              </span>
            ) : null}
            {note.title.length > 0 ? (
              <h3 className='line-clamp-3 break-words text-[15px] font-semibold tracking-tight'>
                <HighlightText text={note.title} query={searchQuery} />
              </h3>
            ) : (
              <span className='sr-only'>Untitled note</span>
            )}
              </div>
              {!isTrash && !selectionActive ? (
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
              className={`-mt-1.5 -mr-1.5 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                note.pinned
                  ? 'text-foreground'
                  : 'text-muted opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
              }`}
            >
              <Icon name={note.pinned ? 'pinFilled' : 'pin'} size={18} />
            </span>
              ) : null}
            </div>
            {note.labels.length > 0 ? (
              <div className='flex flex-wrap gap-1 pt-2'>
                {note.labels.map(
                  (label: string): JSX.Element => (
                    <button
                      key={label}
                      type='button'
                      onClick={(event): void => {
                        event.stopPropagation()
                        onLabelClick?.(label)
                      }}
                      className='rounded-full bg-surface-hover px-2 py-0.5 text-[11px] font-medium text-muted transition-colors hover:text-foreground'
                    >
                      <HighlightText text={label} query={searchQuery} />
                    </button>
                  ),
                )}
              </div>
            ) : null}
            {note.content.length > 0 ? (
              <NoteContent
                content={note.content}
                className='line-clamp-6 break-words pb-1 pt-2 text-sm text-muted'
                interactive={!isTrash && !selectionActive}
                searchQuery={searchQuery}
                onContentChange={(next: string): void => onContentChange?.(note.id, next)}
                onNoteLinkClick={onNoteLinkClick}
              />
            ) : (
              <div className='h-2' />
            )}
          </div>
        </div>
      </div>

      {!selectionActive ? (
        <div className='flex items-center justify-between px-2 pb-2 pt-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'>
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
              <ListPicker
                listId={note.listId}
                lists={lists}
                onChange={(listId: string | null): void => onSetListId(note.id, listId)}
                onCreateList={onCreateList}
              />
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
                <div className='absolute bottom-11 left-0 z-10 rounded-xl border border-border bg-surface p-2.5 shadow-lg shadow-black/5'>
                  <ColorPicker
                    value={note.color}
                    onChange={(next: NoteColor): void => onChangeColor(note.id, next)}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </article>
  )
}
