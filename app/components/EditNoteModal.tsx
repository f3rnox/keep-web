'use client'

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type JSX,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import type { Note, NoteColor } from '../lib/types'
import { getNoteColorClasses } from '../lib/colors'
import { ColorPicker } from './ColorPicker'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

/**
 * Props for the `EditNoteModal` overlay.
 */
export interface EditNoteModalProps {
  note: Note
  onSave: (id: string, patch: { title: string; content: string; color: NoteColor }) => void
  onTogglePinned: (id: string) => void
  onSetArchived: (id: string, archived: boolean) => void
  onSetTrashed: (id: string, trashed: boolean) => void
  onClose: () => void
}

/**
 * Modal note editor that opens when the user clicks an existing note tile,
 * mirroring Keep's expanded card. Auto-saves any pending edits when the
 * user closes the modal.
 *
 * @param props.note The note being edited (used to seed the form state).
 * @param props.onSave Persists the latest title/content/color.
 * @param props.onTogglePinned Pin/unpin the note.
 * @param props.onSetArchived Archive/unarchive the note.
 * @param props.onSetTrashed Move the note to trash.
 * @param props.onClose Closes the modal (after autosaving).
 */
export function EditNoteModal({
  note,
  onSave,
  onTogglePinned,
  onSetArchived,
  onSetTrashed,
  onClose,
}: EditNoteModalProps): JSX.Element {
  const [title, setTitle] = useState<string>(note.title)
  const [content, setContent] = useState<string>(note.content)
  const [color, setColor] = useState<NoteColor>(note.color)
  const [showPalette, setShowPalette] = useState<boolean>(false)

  const close = useCallback((): void => {
    onSave(note.id, { title, content, color })
    onClose()
  }, [note.id, title, content, color, onSave, onClose])

  useEffect((): (() => void) => {
    const handler = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }
    document.addEventListener('keydown', handler)
    return (): void => document.removeEventListener('keydown', handler)
  }, [close])

  const stop = (event: ReactMouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>): void => {
    event.stopPropagation()
  }

  const classes = getNoteColorClasses(color)

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Edit note'
      onClick={close}
      className='fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'
    >
      <div
        onClick={stop}
        onKeyDown={stop}
        className={`relative flex w-full max-w-xl flex-col rounded-lg border ${classes.bg} ${classes.border} text-neutral-900 shadow-xl dark:text-neutral-100`}
      >
        <div className='flex items-start justify-between gap-2 px-4 pt-3'>
          <input
            type='text'
            value={title}
            onChange={(event: ChangeEvent<HTMLInputElement>): void => setTitle(event.target.value)}
            placeholder='Title'
            className='w-full bg-transparent text-lg font-medium outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-400'
            autoFocus
          />
          <span
            role='button'
            tabIndex={0}
            aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
            title={note.pinned ? 'Unpin note' : 'Pin note'}
            onClick={(): void => onTogglePinned(note.id)}
            onKeyDown={(event: KeyboardEvent<HTMLSpanElement>): void => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              onTogglePinned(note.id)
            }}
            className='inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-neutral-500 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-neutral-300 dark:hover:bg-white/10'
          >
            <Icon name={note.pinned ? 'pinFilled' : 'pin'} />
          </span>
        </div>

        <textarea
          value={content}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>): void =>
            setContent(event.target.value)
          }
          placeholder='Take a note...'
          rows={8}
          className='w-full resize-none bg-transparent px-4 py-3 text-base outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-400'
        />

        <div className='relative flex items-center justify-between px-2 pb-2 pt-1'>
          <div className='flex items-center gap-1'>
            <IconButton
              label='Background options'
              active={showPalette}
              onClick={(): void => setShowPalette((prev: boolean): boolean => !prev)}
            >
              <Icon name='palette' size={18} />
            </IconButton>
            <IconButton
              label={note.archived ? 'Unarchive' : 'Archive'}
              onClick={(): void => onSetArchived(note.id, !note.archived)}
            >
              <Icon name={note.archived ? 'unarchive' : 'archive'} size={18} />
            </IconButton>
            <IconButton
              label='Move to trash'
              onClick={(): void => {
                onSetTrashed(note.id, true)
                onClose()
              }}
            >
              <Icon name='trash' size={18} />
            </IconButton>
          </div>

          <button
            type='button'
            onClick={close}
            className='rounded-md px-4 py-1.5 text-sm font-medium text-neutral-700 hover:bg-black/10 dark:text-neutral-200 dark:hover:bg-white/10'
          >
            Close
          </button>

          {showPalette ? (
            <div className='absolute bottom-12 left-2 z-10 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900'>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
