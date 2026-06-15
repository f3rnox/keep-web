'use client'

import { useCallback, useEffect, type JSX, type KeyboardEvent, type MouseEvent } from 'react'
import { Icon } from './Icon'

/**
 * Props for the confirmation dialog.
 */
export interface ConfirmModalProps {
  title: string
  description: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modal that asks the user to confirm a destructive or irreversible action.
 */
export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps): JSX.Element {
  const stopPropagation = useCallback((event: MouseEvent | KeyboardEvent): void => {
    event.stopPropagation()
  }, [])

  useEffect((): (() => void) => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }

    document.addEventListener('keydown', handler)
    return (): void => document.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label={title}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
      onClick={onCancel}
    >
      <div
        onClick={stopPropagation}
        className='w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-black/20'
      >
        <div className='mb-4 flex items-start gap-3'>
          <span className='mt-0.5 text-muted'>
            <Icon name='trash' size={20} />
          </span>
          <div>
            <h2 className='text-base font-semibold text-foreground'>{title}</h2>
            <p className='mt-1 text-sm text-muted'>{description}</p>
          </div>
        </div>

        <div className='flex justify-end gap-2'>
          <button
            type='button'
            autoFocus
            onClick={onCancel}
            className='rounded-lg px-4 py-2 text-sm font-medium text-muted transition hover:text-foreground'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirm}
            className={
              destructive
                ? 'rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                : 'rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:opacity-90'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
