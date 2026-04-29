'use client'

import type { JSX } from 'react'

/**
 * Props for the `TrashBanner` shown above the trash view.
 */
export interface TrashBannerProps {
  count: number
  onEmpty: () => void
}

/**
 * Compact info bar that appears at the top of the Trash view explaining the
 * auto-delete behavior and exposing a one-click "Empty trash" action.
 *
 * @param props.count Current number of notes in trash.
 * @param props.onEmpty Invoked when the user clicks "Empty trash".
 */
export function TrashBanner({ count, onEmpty }: TrashBannerProps): JSX.Element {
  return (
    <div className='mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md bg-neutral-100 px-4 py-3 text-sm text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'>
      <span>Notes in Trash are deleted after 7 days.</span>
      <button
        type='button'
        onClick={onEmpty}
        disabled={count === 0}
        className='rounded-md bg-neutral-200 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-neutral-700 transition hover:bg-neutral-300 disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
      >
        Empty trash
      </button>
    </div>
  )
}
