'use client'

import { useEffect, useRef, useState, type DragEvent, type FormEvent, type JSX } from 'react'
import type { Note, NoteList, NoteView } from '../lib/types'
import { countListNotes } from '../lib/countListNotes'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

/**
 * Props for the primary app sidebar navigation.
 */
export interface AppSidebarProps {
  view: NoteView
  selectedListId: string | null
  lists: ReadonlyArray<NoteList>
  notes: ReadonlyArray<Note>
  notesCount: number
  archiveCount: number
  trashCount: number
  onSelectNotes: () => void
  onSelectList: (listId: string) => void
  onSelectArchive: () => void
  onSelectTrash: () => void
  onCreateList: (name: string) => void
  onDeleteList: (id: string) => void
  onDropNote: (listId: string, noteId: string) => void
  className?: string
}

/**
 * Left sidebar with Notes, named lists, and archive/trash links.
 */
export function AppSidebar({
  view,
  selectedListId,
  lists,
  notes,
  notesCount,
  archiveCount,
  trashCount,
  onSelectNotes,
  onSelectList,
  onSelectArchive,
  onSelectTrash,
  onCreateList,
  onDeleteList,
  onDropNote,
  className = '',
}: AppSidebarProps): JSX.Element {
  const [newListName, setNewListName] = useState<string>('')
  const [showNewListForm, setShowNewListForm] = useState<boolean>(false)
  const [dragOverListId, setDragOverListId] = useState<string | null>(null)
  const newListInputRef = useRef<HTMLInputElement | null>(null)

  useEffect((): void => {
    if (showNewListForm && newListInputRef.current) {
      newListInputRef.current.focus()
    }
  }, [showNewListForm])

  const submitList = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const trimmed: string = newListName.trim()
    if (trimmed.length === 0) return
    onCreateList(trimmed)
    setNewListName('')
    setShowNewListForm(false)
  }

  const navButtonClass = (active: boolean): string =>
    `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
      active
        ? 'bg-accent/10 font-medium text-foreground'
        : 'text-muted hover:bg-surface-hover hover:text-foreground'
    }`

  const countBadgeClass = (active: boolean): string =>
    `ml-auto min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] tabular-nums ${
      active ? 'bg-accent text-on-accent' : 'bg-surface-hover text-muted'
    }`

  return (
    <aside
      aria-label='Navigation'
      className={`flex w-60 shrink-0 flex-col border-r border-border bg-canvas ${className}`}
    >
      <nav className='flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3'>
        <button
          type='button'
          onClick={onSelectNotes}
          aria-current={view === 'notes' ? 'page' : undefined}
          className={navButtonClass(view === 'notes')}
        >
          <Icon name='lightbulb' size={18} />
          <span>Notes</span>
          <span className={countBadgeClass(view === 'notes')}>{notesCount}</span>
        </button>

        <div className='mt-4 flex min-h-0 flex-1 flex-col gap-0.5'>
          <p className='px-3 pb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted'>
            Lists
          </p>
          {lists.map((list: NoteList): JSX.Element => {
            const active: boolean = view === 'lists' && selectedListId === list.id
            const noteCount: number = countListNotes(notes, list.id)
            const dragOver: boolean = dragOverListId === list.id

            return (
              <div
                key={list.id}
                className={`group relative ${dragOver ? 'rounded-lg ring-2 ring-accent' : ''}`}
                onDragOver={(event: DragEvent<HTMLDivElement>): void => {
                  if (!event.dataTransfer.types.includes('text/note-id')) return
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  setDragOverListId(list.id)
                }}
                onDragLeave={(): void => setDragOverListId(null)}
                onDrop={(event: DragEvent<HTMLDivElement>): void => {
                  event.preventDefault()
                  setDragOverListId(null)
                  const noteId: string = event.dataTransfer.getData('text/note-id')
                  if (noteId.length > 0) onDropNote(list.id, noteId)
                }}
              >
                <button
                  type='button'
                  onClick={(): void => onSelectList(list.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`${navButtonClass(active)} pr-10`}
                >
                  <Icon name='list' size={18} />
                  <span className='min-w-0 truncate'>{list.name}</span>
                  <span className={countBadgeClass(active)}>{noteCount}</span>
                </button>
                <div className='absolute right-1 top-1/2 z-10 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'>
                  <IconButton
                    label={`Delete ${list.name}`}
                    onClick={(): void => onDeleteList(list.id)}
                  >
                    <Icon name='trash' size={16} />
                  </IconButton>
                </div>
              </div>
            )
          })}

          {showNewListForm ? (
            <form onSubmit={submitList} className='mt-2 flex items-center gap-1.5 px-1'>
              <input
                ref={newListInputRef}
                type='text'
                value={newListName}
                onChange={(event): void => setNewListName(event.target.value)}
                placeholder='List name'
                className='min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring'
              />
              <button
                type='submit'
                disabled={newListName.trim().length === 0}
                aria-label='Create list'
                className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-on-accent transition hover:opacity-90 disabled:opacity-40'
              >
                <Icon name='plus' size={16} />
              </button>
            </form>
          ) : (
            <button
              type='button'
              onClick={(): void => setShowNewListForm(true)}
              className={`${navButtonClass(false)} mt-1`}
            >
              <Icon name='plus' size={18} />
              <span>New list</span>
            </button>
          )}
        </div>

        <div className='mt-auto flex flex-col gap-0.5 border-t border-border pt-3'>
          <button
            type='button'
            onClick={onSelectArchive}
            aria-current={view === 'archive' ? 'page' : undefined}
            className={navButtonClass(view === 'archive')}
          >
            <Icon name='archive' size={18} />
            <span>Archive</span>
            <span className={countBadgeClass(view === 'archive')}>{archiveCount}</span>
          </button>
          <button
            type='button'
            onClick={onSelectTrash}
            aria-current={view === 'trash' ? 'page' : undefined}
            className={navButtonClass(view === 'trash')}
          >
            <Icon name='trash' size={18} />
            <span>Trash</span>
            <span className={countBadgeClass(view === 'trash')}>{trashCount}</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}
