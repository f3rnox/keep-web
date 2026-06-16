'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type JSX,
  type KeyboardEvent,
} from 'react'
import Link from 'next/link'
import type { NoteColor, NoteCipher, Note } from '../lib/types'
import { encryptNoteContent } from '../lib/encryptNoteContent'
import { base64ToBytes } from '../lib/base64ToBytes'
import { deriveKeyFromPassword } from '../lib/deriveKeyFromPassword'
import { setSessionKey } from '../lib/encryptionSessionStore'
import { getEncryptionPassword } from '../lib/getEncryptionPassword'
import { unlockGlobalEncryption } from '../lib/unlockGlobalEncryption'
import {
  getGlobalEncryptionVersion,
  subscribeGlobalEncryption,
} from '../lib/globalEncryptionSession'
import { useMasterPassword } from '../lib/useMasterPassword'
import { getNoteColorClasses } from '../lib/colors'
import { handleMarkdownKeyDown } from '../lib/handleMarkdownKeyDown'
import { insertImageMarkdown } from '../lib/insertImageMarkdown'
import { clipboardHasImages, dragHasImages } from '../lib/clipboardHasImages'
import { readImageDataUrls } from '../lib/readImageDataUrls'
import { ColorPicker } from './ColorPicker'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { LabelEditor } from './LabelEditor'
import { MarkdownToolbar } from './MarkdownToolbar'
import { PasswordPromptModal } from './PasswordPromptModal'
import { ReminderPicker } from './ReminderPicker'
import { SuggestTitleButton } from './SuggestTitleButton'

/**
 * Handle exposed to parent components for controlling the inline editor.
 */
export interface NoteEditorHandle {
  expand: () => void
}

/**
 * Props for the inline `NoteEditor` placed at the top of the notes view.
 */
export interface NoteEditorProps {
  listId?: string | null
  defaultLabels?: ReadonlyArray<string>
  onCreate: (
    title: string,
    content: string,
    color: NoteColor,
    labels: ReadonlyArray<string>,
    listId?: string | null,
    encryption?: { encrypted: boolean, cipher: NoteCipher | null },
    dueAt?: number | null,
  ) => Note | null | Promise<Note | null>
}

/**
 * Compact-to-expanded inline editor that mirrors Google Keep's "Take a
 * note..." widget. Collapses back to its prompt state after submitting or
 * when the user clicks outside.
 */
export const NoteEditor = forwardRef<NoteEditorHandle, NoteEditorProps>(function NoteEditor(
  { listId = null, defaultLabels = [], onCreate },
  ref,
): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false)
  const [title, setTitle] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [labels, setLabels] = useState<ReadonlyArray<string>>([])
  const [color, setColor] = useState<NoteColor>('default')
  const [dueAt, setDueAt] = useState<number | null>(null)
  const [showPalette, setShowPalette] = useState<boolean>(false)
  const [lockNote, setLockNote] = useState<boolean>(false)
  const [showConfigurePrompt, setShowConfigurePrompt] = useState<boolean>(false)
  const [showUnlockPrompt, setShowUnlockPrompt] = useState<boolean>(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [unlockBusy, setUnlockBusy] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const { hasMasterPassword } = useMasterPassword()
  const globalVersion: number = useSyncExternalStore(
    subscribeGlobalEncryption,
    getGlobalEncryptionVersion,
    (): number => 0,
  )
  void globalVersion

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLTextAreaElement | null>(null)
  const wasExpandedRef = useRef<boolean>(false)
  const globalPassword: string | null = getEncryptionPassword()

  const reset = useCallback((): void => {
    setTitle('')
    setContent('')
    setLabels([])
    setColor('default')
    setDueAt(null)
    setExpanded(false)
    setShowPalette(false)
    setLockNote(false)
    setShowConfigurePrompt(false)
    setShowUnlockPrompt(false)
    setUnlockError(null)
    setUnlockBusy(false)
    setSubmitError(null)
    setSubmitting(false)
  }, [])

  const handleUnlockForLock = useCallback(async (password: string): Promise<void> => {
    setUnlockBusy(true)
    setUnlockError(null)
    try {
      const unlocked: boolean = await unlockGlobalEncryption(password)
      if (!unlocked) {
        setUnlockError('Incorrect password')
        return
      }
      setShowUnlockPrompt(false)
      setLockNote(true)
    } catch {
      setUnlockError('Incorrect password')
    } finally {
      setUnlockBusy(false)
    }
  }, [])

  const handleLockToggle = useCallback((): void => {
    if (lockNote) {
      setLockNote(false)
      setShowConfigurePrompt(false)
      return
    }

    if (!hasMasterPassword) {
      setShowConfigurePrompt(true)
      return
    }

    if (globalPassword === null) {
      setShowUnlockPrompt(true)
      return
    }

    setLockNote(true)
  }, [lockNote, hasMasterPassword, globalPassword])

  const submit = useCallback(async (): Promise<void> => {
    if (title.trim().length === 0 && content.trim().length === 0) {
      reset()
      return
    }

    if (lockNote) {
      if (!hasMasterPassword) {
        setShowConfigurePrompt(true)
        return
      }

      const encryptionPassword: string | null = getEncryptionPassword()
      if (encryptionPassword === null) {
        setShowUnlockPrompt(true)
        return
      }

      setSubmitting(true)
      setSubmitError(null)

      try {
        const plaintextContent: string = content
        const encrypted = await encryptNoteContent(title, plaintextContent, encryptionPassword)
        const salt: Uint8Array<ArrayBuffer> = base64ToBytes(encrypted.cipher.salt)
        const key: CryptoKey = await deriveKeyFromPassword(
          encryptionPassword,
          salt,
          encrypted.cipher.iterations,
        )
        const created: Note | null = await onCreate(
          encrypted.title,
          encrypted.content,
          color,
          labels,
          listId,
          { encrypted: true, cipher: encrypted.cipher },
          dueAt,
        )
        if (created) {
          setSessionKey(created.id, key, plaintextContent)
        }
        reset()
      } catch {
        setSubmitError('Could not create encrypted note')
        setSubmitting(false)
      }
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await onCreate(title, content, color, labels, listId, undefined, dueAt)
      reset()
    } catch {
      setSubmitError('Could not create note')
      setSubmitting(false)
    }
  }, [title, content, color, labels, listId, dueAt, lockNote, hasMasterPassword, onCreate, reset])

  useImperativeHandle(
    ref,
    (): NoteEditorHandle => ({
      expand: (): void => setExpanded(true),
    }),
    [],
  )

  useEffect((): void => {
    if (expanded && !wasExpandedRef.current) {
      setLabels(defaultLabels)
    }
    wasExpandedRef.current = expanded
  }, [expanded, defaultLabels])

  useEffect((): (() => void) | void => {
    if (!expanded) return
    const handler = (event: MouseEvent): void => {
      if (!wrapperRef.current) return
      if (event.target instanceof Node && wrapperRef.current.contains(event.target)) return
      if (lockNote && getEncryptionPassword() === null) return
      void submit()
    }
    document.addEventListener('mousedown', handler)
    return (): void => document.removeEventListener('mousedown', handler)
  }, [expanded, submit, lockNote])

  useEffect((): void => {
    if (expanded && contentRef.current) {
      contentRef.current.focus()
    }
  }, [expanded])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      reset()
    }
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
    <>
      {showUnlockPrompt ? (
        <PasswordPromptModal
          title='Unlock encryption'
          description='Enter your encryption password to lock this note.'
          confirmLabel='Unlock'
          error={unlockError}
          busy={unlockBusy}
          onSubmit={handleUnlockForLock}
          onCancel={(): void => {
            setShowUnlockPrompt(false)
            setUnlockError(null)
          }}
        />
      ) : null}

      <div className='flex w-full justify-center'>
        <div
          ref={wrapperRef}
          onKeyDown={handleKeyDown}
          className={`w-full max-w-2xl rounded-xl border border-border bg-surface ${classes.tint} ${stripClass} transition-colors`}
        >
          {expanded ? (
            <div className='flex flex-col gap-1 px-4 py-3.5'>
              <div className='flex items-start gap-2'>
                <input
                  type='text'
                  value={title}
                  onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                    setTitle(event.target.value)
                  }
                  placeholder='Title'
                  className='min-w-0 flex-1 bg-transparent text-[15px] font-semibold tracking-tight text-foreground outline-none placeholder:font-normal placeholder:text-muted'
                />
                <SuggestTitleButton content={content} onSuggested={setTitle} />
              </div>
              <MarkdownToolbar
                textareaRef={contentRef}
                value={content}
                onChange={setContent}
              />
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
                placeholder='Write something...'
                rows={3}
                className='w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted'
              />
              <LabelEditor labels={labels} onChange={setLabels} />
              {showConfigurePrompt ? (
                <div className='mt-2 rounded-lg border border-border bg-canvas/50 p-3 text-sm text-muted'>
                  <p>Set an encryption password before locking notes.</p>
                  <Link
                    href='/settings/security'
                    className='mt-2 inline-block font-medium text-foreground underline underline-offset-2'
                  >
                    Configure encryption password
                  </Link>
                </div>
              ) : null}
              {lockNote && hasMasterPassword && globalPassword !== null ? (
                <p className='text-xs text-muted'>Will be locked with your encryption password.</p>
              ) : null}
              {submitError ? (
                <p className='text-sm text-red-600 dark:text-red-400'>{submitError}</p>
              ) : null}
              <div className='relative mt-1 flex items-center justify-between'>
                <div className='flex items-center'>
                  <IconButton
                    label={lockNote ? 'Note will be password-protected' : 'Protect with password'}
                    active={lockNote}
                    onClick={handleLockToggle}
                  >
                    <Icon name={lockNote ? 'lock' : 'lockOpen'} size={18} />
                  </IconButton>
                  <IconButton
                    label='Background options'
                    active={showPalette}
                    onClick={(): void => setShowPalette((prev: boolean): boolean => !prev)}
                  >
                    <Icon name='palette' size={18} />
                  </IconButton>
                  <ReminderPicker dueAt={dueAt} onChange={setDueAt} />
                </div>
                <button
                  type='button'
                  onClick={(): void => {
                    void submit()
                  }}
                  disabled={submitting}
                  className='rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-on-accent transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'
                >
                  {submitting ? 'Adding…' : 'Add'}
                </button>
                {showPalette ? (
                  <div className='absolute left-0 top-11 z-10 rounded-xl border border-border bg-surface p-2.5 shadow-lg shadow-black/5'>
                    <ColorPicker value={color} onChange={setColor} />
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <button
              type='button'
              onClick={(): void => setExpanded(true)}
              className='flex w-full items-center justify-between px-4 py-3.5 text-left text-sm text-muted transition-colors hover:text-foreground'
            >
              <span>Write something...</span>
              <span className='text-muted'>
                <Icon name='plus' size={18} />
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  )
})
