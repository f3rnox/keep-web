'use client'

import { useEffect, useRef, useState, type JSX } from 'react'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { DueDatePicker } from './DueDatePicker'

/**
 * Props for the reminder date popover control.
 */
export interface ReminderPickerProps {
  dueAt: number | null
  onChange: (dueAt: number | null) => void
  disabled?: boolean
}

/**
 * Popover button that opens a due-date picker for notes and tasks.
 */
export function ReminderPicker({
  dueAt,
  onChange,
  disabled = false,
}: ReminderPickerProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect((): (() => void) | void => {
    if (!open) return
    const handler = (event: MouseEvent): void => {
      if (!wrapperRef.current) return
      if (event.target instanceof Node && wrapperRef.current.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return (): void => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={wrapperRef} className='relative'>
      <IconButton
        label={dueAt !== null ? 'Edit reminder' : 'Add reminder'}
        active={dueAt !== null}
        disabled={disabled}
        onClick={(): void => setOpen((prev: boolean): boolean => !prev)}
      >
        <Icon name='lightbulb' size={18} />
      </IconButton>
      {open ? (
        <div className='absolute right-0 top-10 z-20 min-w-[220px] rounded-xl border border-border bg-surface p-3 shadow-lg shadow-black/5'>
          <DueDatePicker
            dueAt={dueAt}
            onChange={(next: number | null): void => {
              onChange(next)
              if (next === null) setOpen(false)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
