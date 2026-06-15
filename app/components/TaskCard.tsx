'use client'

import { useCallback, useState, type JSX } from 'react'
import type { Note, NoteList, NoteView } from '../lib/types'
import { formatDueDate } from '../lib/formatDueDate'
import { isNoteOverdue } from '../lib/isNoteOverdue'
import { HighlightText } from './HighlightText'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { ListPicker } from './ListPicker'
import { ReminderPicker } from './ReminderPicker'

/**
 * Props for a single checkbox task row.
 */
export interface TaskCardProps {
  note: Note
  view: NoteView
  lists: ReadonlyArray<NoteList>
  listName?: string | null
  searchQuery?: string
  onToggleDone: (id: string) => void
  onUpdateTitle: (id: string, title: string) => void
  onSetTrashed: (id: string, trashed: boolean) => void
  onSetArchived: (id: string, archived: boolean) => void
  onDeleteForever: (id: string) => void
  onSetListId: (id: string, listId: string | null) => void
  onSetDueAt: (id: string, dueAt: number | null) => void
  onCreateList?: (name: string) => NoteList | null
}

/**
 * One-line task with a completion checkbox and inline title editing.
 */
export function TaskCard({
  note,
  view,
  lists,
  listName = null,
  searchQuery = '',
  onToggleDone,
  onUpdateTitle,
  onSetTrashed,
  onSetArchived,
  onDeleteForever,
  onSetListId,
  onSetDueAt,
  onCreateList,
}: TaskCardProps): JSX.Element {
  const [editing, setEditing] = useState<boolean>(false)
  const [draft, setDraft] = useState<string>(note.title)
  const isTrash: boolean = view === 'trash'
  const isArchive: boolean = view === 'archive'
  const isReadOnly: boolean = isTrash || isArchive
  const isOverdue: boolean = isNoteOverdue(note.dueAt) && !isReadOnly

  const commitTitle = useCallback((): void => {
    const trimmed: string = draft.trim()
    if (trimmed.length === 0) {
      setDraft(note.title)
      setEditing(false)
      return
    }
    if (trimmed !== note.title) onUpdateTitle(note.id, trimmed)
    setEditing(false)
  }, [draft, note.id, note.title, onUpdateTitle])

  return (
    <article
      className={`group flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 transition-colors hover:border-foreground/20 ${
        note.taskDone ? 'opacity-70' : ''
      }`}
    >
      <label className='flex shrink-0 cursor-pointer items-center'>
        <input
          type='checkbox'
          checked={note.taskDone}
          disabled={isReadOnly}
          onChange={(): void => onToggleDone(note.id)}
          className='h-4 w-4 accent-accent'
          aria-label={note.taskDone ? 'Mark task incomplete' : 'Mark task complete'}
        />
      </label>

      <div className='min-w-0 flex-1'>
        {listName ? (
          <span className='mb-0.5 inline-block rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-medium text-muted'>
            {listName}
          </span>
        ) : null}
        {note.dueAt !== null ? (
          <span
            className={`mb-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              isOverdue
                ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                : 'bg-surface-hover text-muted'
            }`}
          >
            <Icon name='lightbulb' size={12} />
            {formatDueDate(note.dueAt)}
          </span>
        ) : null}
        {editing && !isReadOnly ? (
          <input
            type='text'
            value={draft}
            autoFocus
            onChange={(event): void => setDraft(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event): void => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitTitle()
              }
              if (event.key === 'Escape') {
                setDraft(note.title)
                setEditing(false)
              }
            }}
            className='w-full bg-transparent text-sm text-foreground outline-none'
            aria-label='Edit task'
          />
        ) : (
          <button
            type='button'
            disabled={isReadOnly}
            onClick={(): void => {
              if (isReadOnly) return
              setDraft(note.title)
              setEditing(true)
            }}
            className={`block w-full text-left text-sm ${
              note.taskDone
                ? 'text-muted line-through'
                : 'text-foreground'
            } ${isReadOnly ? 'cursor-default' : 'cursor-text'}`}
          >
            <HighlightText text={note.title || 'Untitled task'} query={searchQuery} />
          </button>
        )}
      </div>

      <div className='flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'>
        {isTrash ? (
          <>
            <IconButton
              label='Restore task'
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
          </>
        ) : isArchive ? (
          <IconButton
            label='Unarchive task'
            onClick={(): void => onSetArchived(note.id, false)}
          >
            <Icon name='unarchive' size={18} />
          </IconButton>
        ) : (
          <>
            <ReminderPicker
              dueAt={note.dueAt}
              disabled={isReadOnly}
              onChange={(dueAt: number | null): void => onSetDueAt(note.id, dueAt)}
            />
            <ListPicker
              listId={note.listId}
              lists={lists}
              onChange={(listId: string | null): void => onSetListId(note.id, listId)}
              onCreateList={onCreateList}
            />
            <IconButton
              label='Move to trash'
              onClick={(): void => onSetTrashed(note.id, true)}
            >
              <Icon name='trash' size={18} />
            </IconButton>
          </>
        )}
      </div>
    </article>
  )
}
