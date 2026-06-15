'use client'

import { useCallback, useEffect, useState, type FormEvent, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

/**
 * Props for the password prompt modal.
 */
export interface PasswordPromptModalProps {
  title: string
  description?: string
  confirmLabel?: string
  requireConfirm?: boolean
  error?: string | null
  busy?: boolean
  onSubmit: (password: string) => void | Promise<void>
  onCancel: () => void
  onPasskeyUnlock?: () => void | Promise<void>
}

/**
 * Modal that collects a password (and optional confirmation) from the user.
 */
export function PasswordPromptModal({
  title,
  description,
  confirmLabel = 'Unlock',
  requireConfirm = false,
  error = null,
  busy = false,
  onSubmit,
  onCancel,
  onPasskeyUnlock,
}: PasswordPromptModalProps): JSX.Element {
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault()
      if (password.length === 0) return
      if (requireConfirm && password !== confirmPassword) return
      await onSubmit(password)
    },
    [password, confirmPassword, requireConfirm, onSubmit],
  )

  const mismatch: boolean =
    requireConfirm && confirmPassword.length > 0 && password !== confirmPassword

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

  return createPortal(
    <div
      role='dialog'
      aria-modal='true'
      aria-label={title}
      className='fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm'
      onClick={onCancel}
    >
      <div className='safe-top safe-bottom flex min-h-full items-end justify-center p-4 sm:items-center'>
        <form
          onClick={(event): void => event.stopPropagation()}
          onSubmit={handleSubmit}
          className='my-auto w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 shadow-2xl shadow-black/20 sm:rounded-2xl'
        >
        <div className='mb-4 flex items-start gap-3'>
          <span className='mt-0.5 text-muted'>
            <Icon name='lock' size={20} />
          </span>
          <div>
            <h2 className='text-base font-semibold text-foreground'>{title}</h2>
            {description ? (
              <p className='mt-1 text-sm text-muted'>{description}</p>
            ) : null}
          </div>
        </div>

        <label className='mb-3 block'>
          <span className='mb-1 block text-xs font-medium text-muted'>Password</span>
          <input
            type='password'
            value={password}
            onChange={(event): void => setPassword(event.target.value)}
            autoFocus
            autoComplete={requireConfirm ? 'new-password' : 'current-password'}
            className='w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
          />
        </label>

        {requireConfirm ? (
          <label className='mb-3 block'>
            <span className='mb-1 block text-xs font-medium text-muted'>Confirm password</span>
            <input
              type='password'
              value={confirmPassword}
              onChange={(event): void => setConfirmPassword(event.target.value)}
              autoComplete='new-password'
              className='w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
            />
          </label>
        ) : null}

        {error ? <p className='mb-3 text-sm text-red-600 dark:text-red-400'>{error}</p> : null}
        {mismatch ? (
          <p className='mb-3 text-sm text-red-600 dark:text-red-400'>Passwords do not match</p>
        ) : null}

        <div className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
          {onPasskeyUnlock ? (
            <button
              type='button'
              disabled={busy}
              onClick={(): void => {
                void onPasskeyUnlock()
              }}
              className='rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-hover disabled:opacity-50'
            >
              Use passkey
            </button>
          ) : null}
          <button
            type='button'
            onClick={onCancel}
            disabled={busy}
            className='rounded-lg px-4 py-2 text-sm font-medium text-muted transition hover:text-foreground disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={
              busy ||
              password.length === 0 ||
              (requireConfirm && (password !== confirmPassword || confirmPassword.length === 0))
            }
            className='rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:opacity-90 disabled:opacity-50'
          >
            {confirmLabel}
          </button>
        </div>
      </form>
      </div>
    </div>,
    document.body,
  )
}
