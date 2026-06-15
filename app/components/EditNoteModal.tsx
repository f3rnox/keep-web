'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type JSX,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import type { Note, NoteColor, NoteCipher, NoteList } from '../lib/types'
import { findBacklinks } from '../lib/findBacklinks'
import { getNoteColorClasses } from '../lib/colors'
import { handleMarkdownKeyDown } from '../lib/handleMarkdownKeyDown'
import { insertImageMarkdown } from '../lib/insertImageMarkdown'
import { clipboardHasImages, dragHasImages } from '../lib/clipboardHasImages'
import { readImageDataUrls } from '../lib/readImageDataUrls'
import { isNoteEncrypted } from '../lib/isNoteEncrypted'
import { encryptNoteContent } from '../lib/encryptNoteContent'
import { decryptNoteContentWithKey } from '../lib/decryptNoteContent'
import { reencryptNoteContent } from '../lib/reencryptNoteContent'
import * as encryptionSession from '../lib/encryptionSessionStore'
import { getNotesSnapshot } from '../lib/notesStore'
import { base64ToBytes } from '../lib/base64ToBytes'
import { deriveKeyFromPassword } from '../lib/deriveKeyFromPassword'
import { unlockNoteSession } from '../lib/unlockNoteSession'
import { getEncryptionPassword } from '../lib/getEncryptionPassword'
import { unlockGlobalEncryption } from '../lib/unlockGlobalEncryption'
import {
  getGlobalEncryptionVersion,
  isGlobalEncryptionUnlocked,
  subscribeGlobalEncryption,
} from '../lib/globalEncryptionSession'
import { useMasterPassword } from '../lib/useMasterPassword'
import { BacklinksPanel } from './BacklinksPanel'
import { ColorPicker } from './ColorPicker'
import { DueDatePicker } from './DueDatePicker'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { LabelEditor } from './LabelEditor'
import { ListPicker } from './ListPicker'
import { MarkdownToolbar } from './MarkdownToolbar'
import { NoteContent } from './NoteContent'
import { PasswordPromptModal } from './PasswordPromptModal'
import { SuggestTitleButton } from './SuggestTitleButton'

/**
 * Fields saved when closing the edit modal.
 */
export interface EditNoteSavePatch {
  title: string
  content: string
  color: NoteColor
  labels: ReadonlyArray<string>
  dueAt: number | null
  encrypted: boolean
  cipher: NoteCipher | null
}

/**
 * How the note editor is mounted in the page.
 */
export type EditNotePresentation = 'overlay' | 'panel'

/**
 * Props for the `EditNoteModal` overlay.
 */
export interface EditNoteModalProps {
  note: Note
  notes: ReadonlyArray<Note>
  lists: ReadonlyArray<NoteList>
  presentation?: EditNotePresentation
  onSave: (id: string, patch: EditNoteSavePatch) => void
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
  presentation = 'overlay',
  onSave,
  onTogglePinned,
  onSetArchived,
  onSetTrashed,
  onSetListId,
  onCreateList,
  onOpenNote,
  onClose,
}: EditNoteModalProps): JSX.Element {
  const { hasMasterPassword } = useMasterPassword()
  const globalVersion: number = useSyncExternalStore(
    subscribeGlobalEncryption,
    getGlobalEncryptionVersion,
    (): number => 0,
  )
  const encrypted: boolean = isNoteEncrypted(note)

  const [unlocked, setUnlocked] = useState<boolean>(
    (): boolean => !encrypted || encryptionSession.isNoteUnlockedInSession(note.id),
  )
  const [title, setTitle] = useState<string>(note.title)
  const [content, setContent] = useState<string>(encrypted ? '' : note.content)
  const [labels, setLabels] = useState<ReadonlyArray<string>>(note.labels)
  const [color, setColor] = useState<NoteColor>(note.color)
  const [dueAt, setDueAt] = useState<number | null>(note.dueAt)
  const [showPalette, setShowPalette] = useState<boolean>(false)
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [unlockBusy, setUnlockBusy] = useState<boolean>(false)
  const [showLockPrompt, setShowLockPrompt] = useState<boolean>(false)
  const [lockBusy, setLockBusy] = useState<boolean>(false)
  const [lockError, setLockError] = useState<string | null>(null)
  const [isEncryptedDraft, setIsEncryptedDraft] = useState<boolean>(encrypted)
  const contentRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect((): (() => void) | void => {
    if (!encrypted) return

    const key: CryptoKey | undefined = encryptionSession.getSessionKey(note.id)
    if (!key) return

    let cancelled: boolean = false
    void decryptNoteContentWithKey(note, key).then((fields): void => {
      if (cancelled) return
      setContent(fields.content)
      encryptionSession.setSessionContent(note.id, fields.content)
      setUnlocked(true)
      setIsEncryptedDraft(true)
    })

    return (): void => {
      cancelled = true
    }
  }, [note, encrypted])

  useEffect((): (() => void) | void => {
    if (!encrypted || unlocked) return

    const password: string | null = getEncryptionPassword()
    if (password === null) return

    let cancelled: boolean = false
    void unlockNoteSession(note, password).then((fields): void => {
      if (cancelled) return
      setContent(fields.content)
      setUnlocked(true)
      setIsEncryptedDraft(true)
    })

    return (): void => {
      cancelled = true
    }
  }, [note, encrypted, unlocked, globalVersion])

  const backlinks: ReadonlyArray<Note> = useMemo(
    (): ReadonlyArray<Note> => findBacklinks(notes, { ...note, title }),
    [notes, note, title],
  )

  const persist = useCallback(async (): Promise<void> => {
    const stored: Note =
      getNotesSnapshot().find((candidate: Note): boolean => candidate.id === note.id) ?? note
    const storedEncrypted: boolean = isNoteEncrypted(stored)

    if (storedEncrypted && !unlocked) {
      onSave(note.id, {
        title,
        content: stored.content,
        color,
        labels,
        dueAt,
        encrypted: true,
        cipher: stored.cipher,
      })
      return
    }

    if (isEncryptedDraft || storedEncrypted) {
      const key: CryptoKey | undefined = encryptionSession.getSessionKey(note.id)
      if (!key) return

      const cipherNote: Note =
        stored.cipher !== null ? stored : { ...stored, cipher: note.cipher }
      if (cipherNote.cipher === null) return

      const encryptedFields = await reencryptNoteContent(title, content, cipherNote, key)
      encryptionSession.setSessionContent(note.id, content)
      onSave(note.id, {
        title: encryptedFields.title,
        content: encryptedFields.content,
        color,
        labels,
        dueAt,
        encrypted: true,
        cipher: encryptedFields.cipher,
      })
      return
    }

    onSave(note.id, {
      title,
      content,
      color,
      labels,
      dueAt,
      encrypted: false,
      cipher: null,
    })
  }, [unlocked, isEncryptedDraft, note, title, content, color, labels, dueAt, onSave])

  const close = useCallback((): void => {
    void persist().finally((): void => onClose())
  }, [persist, onClose])

  const handleUnlock = useCallback(async (password: string): Promise<void> => {
    setUnlockBusy(true)
    setUnlockError(null)
    try {
      let fields
      const globalPassword: string | null = getEncryptionPassword()
      if (globalPassword !== null) {
        fields = await unlockNoteSession(note)
      } else if (hasMasterPassword) {
        const ok: boolean = await unlockGlobalEncryption(password)
        if (!ok) throw new Error('Incorrect password')
        fields = await unlockNoteSession(note, password)
      } else {
        fields = await unlockNoteSession(note, password)
      }
      setContent(fields.content)
      setUnlocked(true)
      setIsEncryptedDraft(true)
    } catch {
      setUnlockError('Incorrect password')
    } finally {
      setUnlockBusy(false)
    }
  }, [note, hasMasterPassword])

  const handleLockNote = useCallback(async (password: string): Promise<void> => {
    setLockBusy(true)
    setLockError(null)
    try {
      const encryptedFields = await encryptNoteContent(title, content, password)
      const salt: Uint8Array<ArrayBuffer> = base64ToBytes(encryptedFields.cipher.salt)
      const key: CryptoKey = await deriveKeyFromPassword(
        password,
        salt,
        encryptedFields.cipher.iterations,
      )
      encryptionSession.setSessionKey(note.id, key, content)
      setIsEncryptedDraft(true)
      setUnlocked(true)
      setShowLockPrompt(false)
      onSave(note.id, {
        title: encryptedFields.title,
        content: encryptedFields.content,
        color,
        labels,
        dueAt,
        encrypted: true,
        cipher: encryptedFields.cipher,
      })
    } catch {
      setLockError('Could not encrypt note')
    } finally {
      setLockBusy(false)
    }
  }, [title, content, color, labels, dueAt, note.id, onSave])

  const startLockNote = useCallback((): void => {
    const password: string | null = getEncryptionPassword()
    if (password !== null) {
      void handleLockNote(password)
      return
    }
    setLockError(null)
    setShowLockPrompt(true)
  }, [handleLockNote])

  const handleLockPromptSubmit = useCallback(
    async (password: string): Promise<void> => {
      if (hasMasterPassword && !isGlobalEncryptionUnlocked()) {
        const ok: boolean = await unlockGlobalEncryption(password)
        if (!ok) {
          setLockError('Incorrect password')
          return
        }
      }
      await handleLockNote(password)
    },
    [hasMasterPassword, handleLockNote],
  )

  const handleRemoveEncryption = useCallback((): void => {
    encryptionSession.clearSessionKey(note.id)
    setIsEncryptedDraft(false)
    onSave(note.id, {
      title,
      content,
      color,
      labels,
      dueAt,
      encrypted: false,
      cipher: null,
    })
  }, [note.id, title, content, color, labels, dueAt, onSave])

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
  const isPanel: boolean = presentation === 'panel'

  const editorCard = (
    <div
      onClick={isPanel ? undefined : stop}
      onKeyDown={isPanel ? undefined : stop}
      className={`relative flex flex-col overflow-hidden bg-surface ${classes.tint} ${stripClass} text-foreground ${
        isPanel
          ? 'h-full min-h-0 w-full border-0 shadow-none'
          : 'h-dvh max-h-dvh w-full max-w-3xl rounded-t-2xl border border-border shadow-2xl shadow-black/20 sm:h-auto sm:max-h-[90vh] sm:rounded-2xl'
      }`}
    >
          <div className='flex items-start justify-between gap-2 px-4 pt-3 sm:px-5 sm:pt-4'>
            <div className='flex min-w-0 flex-1 items-center gap-2'>
              {isEncryptedDraft ? (
                <span className='shrink-0 text-muted' title='Password protected'>
                  <Icon name='lock' size={18} />
                </span>
              ) : null}
              <input
                type='text'
                value={title}
                onChange={(event: ChangeEvent<HTMLInputElement>): void => setTitle(event.target.value)}
                placeholder='Title'
                className='min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-tight outline-none placeholder:font-normal placeholder:text-muted'
                autoFocus
              />
              <SuggestTitleButton
                content={content}
                onSuggested={setTitle}
                disabled={!unlocked}
              />
            </div>
            <div className='flex shrink-0 items-center gap-1'>
              <IconButton
                label={showPreview ? 'Hide preview' : 'Show preview'}
                active={showPreview}
                disabled={!unlocked}
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

          <div className={`flex min-h-0 flex-1 ${showPreview && unlocked ? 'flex-col lg:flex-row' : 'flex-col'}`}>
            <div className={`flex min-h-0 flex-col ${showPreview && unlocked ? 'lg:w-1/2 lg:border-r lg:border-border' : 'w-full'}`}>
              {unlocked ? (
                <>
                  <div className='px-4 pt-2 sm:px-5'>
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
                    className='min-h-[160px] w-full flex-1 resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-muted sm:min-h-[200px] sm:px-5'
                  />
                </>
              ) : (
                <div className='flex min-h-[160px] flex-col items-center justify-center gap-4 px-4 py-6 sm:min-h-[200px] sm:px-5 sm:py-8'>
                  <span className='text-muted'>
                    <Icon name='lock' size={28} />
                  </span>
                  <p className='text-center text-sm text-muted'>
                    {hasMasterPassword
                      ? 'Enter your encryption password, or unlock all notes from the toolbar.'
                      : 'Enter the password to view and edit this note\'s content.'}
                  </p>
                  <form
                    className='w-full max-w-sm space-y-3'
                    onSubmit={(event): void => {
                      event.preventDefault()
                      const input: HTMLInputElement | null =
                        event.currentTarget.querySelector('input[type="password"]')
                      if (input && input.value.length > 0) {
                        void handleUnlock(input.value)
                      }
                    }}
                  >
                    <input
                      type='password'
                      autoFocus
                      autoComplete='current-password'
                      placeholder='Password'
                      className='w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    />
                    {unlockError ? (
                      <p className='text-sm text-red-600 dark:text-red-400'>{unlockError}</p>
                    ) : null}
                    <button
                      type='submit'
                      disabled={unlockBusy}
                      className='w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:opacity-90 disabled:opacity-50'
                    >
                      {unlockBusy ? 'Unlocking…' : 'Unlock content'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {showPreview && unlocked ? (
              <div className='min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5 lg:w-1/2'>
                <p className='mb-2 text-xs font-medium text-muted'>Preview</p>
                <NoteContent
                  content={content}
                  className='text-sm text-foreground'
                  interactive
                  onContentChange={setContent}
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

          <div className='px-4 pb-2 sm:px-5'>
            <LabelEditor labels={labels} onChange={setLabels} />
            <div className='mt-2'>
              <DueDatePicker dueAt={dueAt} onChange={setDueAt} />
            </div>
          </div>

          <BacklinksPanel backlinks={backlinks} onOpen={onOpenNote} />

          <div className='safe-bottom relative flex flex-col gap-2 px-3 pt-1 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex flex-wrap items-center gap-1'>
              <ListPicker
                listId={note.listId}
                lists={lists}
                onChange={(listId: string | null): void => onSetListId(note.id, listId)}
                onCreateList={onCreateList}
              />
              {isEncryptedDraft && unlocked ? (
                <IconButton
                  label='Remove password protection'
                  onClick={handleRemoveEncryption}
                >
                  <Icon name='lockOpen' size={18} />
                </IconButton>
              ) : !isEncryptedDraft ? (
                <IconButton
                  label='Protect with password'
                  onClick={startLockNote}
                >
                  <Icon name='lock' size={18} />
                </IconButton>
              ) : null}
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
                  void persist().finally((): void => {
                    onSetTrashed(note.id, true)
                    onClose()
                  })
                }}
              >
                <Icon name='trash' size={18} />
              </IconButton>
            </div>

            <button
              type='button'
              onClick={close}
              className='w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:py-1.5'
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
  )

  return (
    <>
      {showLockPrompt ? (
        <PasswordPromptModal
          title='Lock note'
          description={
            hasMasterPassword
              ? 'Enter your encryption password to lock this note.'
              : 'Choose a password. You will need it to view this note\'s content again.'
          }
          confirmLabel='Lock'
          requireConfirm={!hasMasterPassword}
          error={lockError}
          busy={lockBusy}
          onSubmit={handleLockPromptSubmit}
          onCancel={(): void => {
            setShowLockPrompt(false)
            setLockError(null)
          }}
        />
      ) : null}

      {isPanel ? (
        <aside
          role='complementary'
          aria-label='Edit note'
          className='fixed top-14 right-0 bottom-0 z-40 flex w-[min(480px,42vw)] min-w-[320px] flex-col border-l border-border bg-surface shadow-xl shadow-black/10 sm:top-16'
        >
          {editorCard}
        </aside>
      ) : (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Edit note'
          onClick={close}
          className='fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4'
        >
          {editorCard}
        </div>
      )}
    </>
  )
}
