'use client'

import type { JSX, ReactNode } from 'react'

/**
 * Props for a labeled section of notes (e.g. "Pinned", "Others").
 */
export interface NoteSectionProps {
  label?: string
  children: ReactNode
}

/**
 * Wraps a group of notes under an optional uppercase label, used by the main
 * notes view to separate pinned from non-pinned notes.
 *
 * @param props.label Optional heading shown above the contained notes.
 * @param props.children The note grid (or other content) to display.
 */
export function NoteSection({ label, children }: NoteSectionProps): JSX.Element {
  return (
    <section className='mb-8'>
      {label ? (
        <h2 className='mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400'>
          {label}
        </h2>
      ) : null}
      {children}
    </section>
  )
}
