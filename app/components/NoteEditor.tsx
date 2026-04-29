'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type JSX,
  type KeyboardEvent,
} from 'react'
import type { NoteColor } from '../lib/types'
import { getNoteColorClasses } from '../lib/colors'
import { ColorPicker } from './ColorPicker'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

/**
 * Props for the inline `NoteEditor` placed at the top of the notes view.
 */
export interface NoteEditorProps {
  onCreate: (title: string, content: string, color: NoteColor) => void
}

/**
 * Compact-to-expanded inline editor that mirrors Google Keep's "Take a
 * note..." widget. Collapses back to its prompt state after submitting or
 * when the user clicks outside.
 *
 * @param props.onCreate Invoked with the trimmed title/content/color when
 *                       the user finishes composing a note.
 */
export function NoteEditor({ onCreate }: NoteEditorProps): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false)
  const [title, setTitle] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [color, setColor] = useState<NoteColor>('default')
  const [showPalette, setShowPalette] = useState<boolean>(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLTextAreaElement | null>(null)

  const reset = useCallback((): void => {
    setTitle('')
    setContent('')
    setColor('default')
    setExpanded(false)
    setShowPalette(false)
  }, [])

  const submit = useCallback((): void => {
    if (title.trim().length === 0 && content.trim().length === 0) {
      reset()
      return
    }
    onCreate(title, content, color)
    reset()
  }, [title, content, color, onCreate, reset])

  useEffect((): (() => void) | void => {
    if (!expanded) return
    const handler = (event: MouseEvent): void => {
      if (!wrapperRef.current) return
      if (event.target instanceof Node && wrapperRef.current.contains(event.target)) return
      submit()
    }
    document.addEventListener('mousedown', handler)
    return (): void => document.removeEventListener('mousedown', handler)
  }, [expanded, submit])

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

  const classes = getNoteColorClasses(color)

  return (
    <div className='flex w-full justify-center px-2 sm:px-0'>
      <div
        ref={wrapperRef}
        onKeyDown={handleKeyDown}
        className={`w-full max-w-xl rounded-lg border ${classes.bg} ${classes.border} shadow-sm transition`}
      >
        {expanded ? (
          <div className='flex flex-col gap-1 px-4 py-3'>
            <input
              type='text'
              value={title}
              onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                setTitle(event.target.value)
              }
              placeholder='Title'
              className='w-full bg-transparent text-base font-medium text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-400'
            />
            <textarea
              ref={contentRef}
              value={content}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>): void =>
                setContent(event.target.value)
              }
              placeholder='Take a note...'
              rows={3}
              className='w-full resize-none bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-500 dark:text-neutral-200 dark:placeholder:text-neutral-400'
            />
            <div className='relative mt-1 flex items-center justify-between'>
              <div className='flex items-center'>
                <IconButton
                  label='Background options'
                  active={showPalette}
                  onClick={(): void => setShowPalette((prev: boolean): boolean => !prev)}
                >
                  <Icon name='palette' size={18} />
                </IconButton>
              </div>
              <button
                type='button'
                onClick={submit}
                className='rounded-md px-4 py-1.5 text-sm font-medium text-neutral-700 hover:bg-black/10 dark:text-neutral-200 dark:hover:bg-white/10'
              >
                Close
              </button>
              {showPalette ? (
                <div className='absolute left-0 top-10 z-10 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900'>
                  <ColorPicker value={color} onChange={setColor} />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <button
            type='button'
            onClick={(): void => setExpanded(true)}
            className='flex w-full items-center justify-between px-4 py-3 text-left text-base text-neutral-600 dark:text-neutral-300'
          >
            <span>Take a note...</span>
            <span className='text-neutral-500 dark:text-neutral-400'>
              <Icon name='check' />
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
