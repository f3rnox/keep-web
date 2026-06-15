'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type JSX,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import type { Note, NoteColor, NoteList } from '../lib/types'
import { findBacklinks } from '../lib/findBacklinks'
import { getNoteColorClasses } from '../lib/colors'
import { handleMarkdownKeyDown } from '../lib/handleMarkdownKeyDown'
import { insertImageMarkdown } from '../lib/insertImageMarkdown'
import { clipboardHasImages, dragHasImages } from '../lib/clipboardHasImages'
import { readImageDataUrls } from '../lib/readImageDataUrls'
import { BacklinksPanel } from './BacklinksPanel'
import { ColorPicker } from './ColorPicker'
import { DueDatePicker } from './DueDatePicker'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { LabelEditor } from './LabelEditor'
import { ListPicker } from './ListPicker'
import { MarkdownToolbar } from './MarkdownToolbar'
import { NoteContent } from './NoteContent'

/**
 * Props for the `EditNoteModal` overlay.
 */
export interface EditNoteModalProps {
  note: Note
  notes: ReadonlyArray<Note>
  lists: ReadonlyArray<NoteList>
  onSave: (
    id: string,
    patch: {
      title: string
      content: string
      color: NoteColor
      labels: ReadonlyArray<string>
      dueAt: number | null
    },
  ) => void
  onTogglePinned: (id: string) => void
  onSetArchived: (id: string, archived: boolean) => void
  onSetTrashed: (id: string, trashed: boolean) => void
  onSetListId: (id: string, listId: string | null) => void
  onCreateList?: (name: string) => NoteList | null
  onOpenNote: (note: Note) => void
  onClose: () => void
}

/**
 * Modal note editor that opens when the user clicks an existing note tile,
 * mirroring Keep's expanded card. Auto-saves any pending edits when the
 * user closes the modal.
 */
export function EditNoteModal({
  note,
  notes,
  lists,
  onSave,
  onTogglePinned,
  onSetArchived,
  onSetTrashed,
  onSetListId,
  onCreateList,
  onOpenNote,
  onClose,
}: EditNoteModalProps): JSX.Element {
  const [title, setTitle] = useState<string>(note.title)
  const [content, setContent] = useState<string>(note.content)
  const [labels, setLabels] = useState<ReadonlyArray<string>>(note.labels)
  const [color, setColor] = useState<NoteColor>(note.color)
  const [dueAt, setDueAt] = useState<number | null>(note.dueAt)
  const [showPalette, setShowPalette] = useState<boolean>(false)
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const contentRef = useRef<HTMLTextAreaElement | null>(null)

  const backlinks: ReadonlyArray<Note> = useMemo(
    (): ReadonlyArray<Note> => findBacklinks(notes, { ...note, title }),
    [notes, note, title],
  )

  const close = useCallback((): void => {
    onSave(note.id, { title, content, color, labels, dueAt })
    onClose()
  }, [note.id, title, content, color, labels, dueAt, onSave, onClose])

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

  const handlePaste = async (event: ClipboardEvent<HTMLTextAreaElement>): Promise<void> => {
    if (!clipboardHasImages(event.nativeEvent)) return
    event.preventDefault()
    const urls: ReadonlyArray<string> = await readImageDataUrls(event.nativeEvent)
    if (urls.length === 0) return

    const textarea: HTMLTextAreaElement | null = contentRef.current
    const start: number = textarea?.selectionStart ?? content.length
    const end: number = textarea?.selectionEnd ?? content.length
    let next: string = content

    for (const url of urls) {
      next = insertImageMarkdown(next, url, start, end)
    }

    setContent(next)
  }

  const handleDrop = async (event: DragEvent<HTMLTextAreaElement>): Promise<void> => {
    if (!dragHasImages(event.nativeEvent)) return
    event.preventDefault()
    const urls: ReadonlyArray<string> = await readImageDataUrls(event.nativeEvent)
    if (urls.length === 0) return

    const textarea: HTMLTextAreaElement | null = contentRef.current
    const start: number = textarea?.selectionStart ?? content.length
    const end: number = textarea?.selectionEnd ?? content.length
    let next: string = content

    for (const url of urls) {
      next = insertImageMarkdown(next, url, start, end)
    }

    setContent(next)
  }

  const classes = getNoteColorClasses(color)
  const stripClass: string = classes.strip.length > 0 ? `border-l-4 ${classes.strip}` : ''

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Edit note'
      onClick={close}
      className='fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
    >
      <div
        onClick={stop}
        onKeyDown={stop}
        className={`relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface ${classes.tint} ${stripClass} text-foreground shadow-2xl shadow-black/20`}
      >
        <div className='flex items-start justify-between gap-2 px-5 pt-4'>
          <input
            type='text'
            value={title}
            onChange={(event: ChangeEvent<HTMLInputElement>): void => setTitle(event.target.value)}
            placeholder='Title'
            className='w-full bg-transparent text-lg font-semibold tracking-tight outline-none placeholder:font-normal placeholder:text-muted'
            autoFocus
          />
          <div className='flex shrink-0 items-center gap-1'>
            <IconButton
              label={showPreview ? 'Hide preview' : 'Show preview'}
              active={showPreview}
              onClick={(): void => setShowPreview((prev: boolean): boolean => !prev)}
            >
              <Icon name={showPreview ? 'eyeOff' : 'eye'} size={18} />
            </IconButton>
            <span
              role='button'
              tabIndex={0}
              aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
              title={note.pinned ? 'Unpin note (p)' : 'Pin note (p)'}
              onClick={(): void => onTogglePinned(note.id)}
              onKeyDown={(event: KeyboardEvent<HTMLSpanElement>): void => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                onTogglePinned(note.id)
              }}
              className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                note.pinned ? 'text-foreground' : 'text-muted'
              }`}
            >
              <Icon name={note.pinned ? 'pinFilled' : 'pin'} />
            </span>
          </div>
        </div>

        <div className={`flex min-h-0 flex-1 ${showPreview ? 'flex-col lg:flex-row' : 'flex-col'}`}>
          <div className={`flex min-h-0 flex-col ${showPreview ? 'lg:w-1/2 lg:border-r lg:border-border' : 'w-full'}`}>
            <div className='px-5 pt-2'>
              <MarkdownToolbar
                textareaRef={contentRef}
                value={content}
                onChange={setContent}
              />
            </div>

            <textarea
              ref={contentRef}
              value={content}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>): void =>
                setContent(event.target.value)
              }
              onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>): void => {
                handleMarkdownKeyDown(event, content, setContent)
              }}
              onPaste={handlePaste}
              onDrop={handleDrop}
              placeholder='Write something... Use [[Note Title]] to link notes.'
              rows={showPreview ? 10 : 8}
              className='min-h-[200px] w-full flex-1 resize-none bg-transparent px-5 py-3 text-[15px] leading-relaxed outline-none placeholder:text-muted'
            />
          </div>

          {showPreview ? (
            <div className='min-h-0 flex-1 overflow-y-auto px-5 py-3 lg:w-1/2'>
              <p className='mb-2 text-xs font-medium text-muted'>Preview</p>
              <NoteContent
                content={content}
                className='text-sm text-foreground'
                onNoteLinkClick={(linkTitle: string): void => {
                  const target: Note | undefined = notes.find(
                    (candidate: Note): boolean =>
                      !candidate.trashed &&
                      candidate.title.trim().toLowerCase() === linkTitle.trim().toLowerCase(),
                  )
                  if (target) onOpenNote(target)
                }}
              />
            </div>
          ) : null}
        </div>

        <div className='px-5 pb-2'>
          <LabelEditor labels={labels} onChange={setLabels} />
          <div className='mt-2'>
            <DueDatePicker dueAt={dueAt} onChange={setDueAt} />
          </div>
        </div>

        <BacklinksPanel backlinks={backlinks} onOpen={onOpenNote} />

        <div className='relative flex items-center justify-between px-3 pb-3 pt-1'>
          <div className='flex items-center gap-1'>
            <ListPicker
              listId={note.listId}
              lists={lists}
              onChange={(listId: string | null): void => onSetListId(note.id, listId)}
              onCreateList={onCreateList}
            />
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
            className='rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-on-accent transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            Done
          </button>

          {showPalette ? (
            <div className='absolute bottom-14 left-3 z-10 rounded-xl border border-border bg-surface p-2.5 shadow-lg shadow-black/5'>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
