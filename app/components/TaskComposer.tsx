'use client'

import { useCallback, useState, type FormEvent, type JSX, type KeyboardEvent } from 'react'
import { Icon } from './Icon'
import { ReminderPicker } from './ReminderPicker'

const FORM_CLASS: string =
  'mx-auto flex w-full max-w-2xl items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm shadow-black/5'

/**
 * Props for the inline task composer.
 */
export interface TaskComposerProps {
  listId?: string | null
  onCreate: (title: string, listId?: string | null, dueAt?: number | null) => void
}

/**
 * One-line input for quickly adding checkbox tasks to the feed or a list.
 */
export function TaskComposer({ listId = null, onCreate }: TaskComposerProps): JSX.Element {
  const [title, setTitle] = useState<string>('')
  const [dueAt, setDueAt] = useState<number | null>(null)

  const submit = useCallback((): void => {
    const trimmed: string = title.trim()
    if (trimmed.length === 0) return
    onCreate(trimmed, listId, dueAt)
    setTitle('')
    setDueAt(null)
  }, [dueAt, listId, onCreate, title])

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className={FORM_CLASS}>
      <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border text-transparent'>
        <Icon name='check' size={14} />
      </span>
      <input
        type='text'
        value={title}
        onChange={(event): void => setTitle(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Add a task'
        className='min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted'
        aria-label='Add a task'
      />
      <ReminderPicker dueAt={dueAt} onChange={setDueAt} />
    </form>
  )
}
