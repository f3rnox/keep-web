'use client'

import type { JSX } from 'react'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

/**
 * Props for the due date picker control.
 */
export interface DueDatePickerProps {
  dueAt: number | null
  onChange: (dueAt: number | null) => void
}

/**
 * Date/time input for setting note reminders.
 */
export function DueDatePicker({ dueAt, onChange }: DueDatePickerProps): JSX.Element {
  const value: string =
    dueAt !== null
      ? new Date(dueAt).toISOString().slice(0, 16)
      : ''

  return (
    <div className='flex items-center gap-2'>
      <Icon name='lightbulb' size={16} className='text-muted' />
      <input
        type='datetime-local'
        value={value}
        onChange={(event): void => {
          const raw: string = event.target.value
          if (raw.length === 0) {
            onChange(null)
            return
          }
          onChange(new Date(raw).getTime())
        }}
        className='rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
        aria-label='Reminder date and time'
      />
      {dueAt !== null ? (
        <IconButton label='Clear reminder' onClick={(): void => onChange(null)}>
          <Icon name='close' size={16} />
        </IconButton>
      ) : null}
    </div>
  )
}
