'use client'

import type { JSX, ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * Props for a labeled section of notes (e.g. "Pinned", "Others").
 */
export interface NoteSectionProps {
  label?: string
  children: ReactNode
  collapsible?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  count?: number
}

/**
 * Wraps a group of notes under an optional uppercase label, used by the main
 * notes view to separate pinned from non-pinned notes.
 *
 * @param props.label Optional heading shown above the contained notes.
 * @param props.children The note grid (or other content) to display.
 * @param props.collapsible When true, the label toggles visibility of the section body.
 * @param props.collapsed Whether the section body is hidden.
 * @param props.onCollapsedChange Called when the user toggles collapse state.
 * @param props.count Optional item count shown beside the label when collapsible.
 */
export function NoteSection({
  label,
  children,
  collapsible = false,
  collapsed = false,
  onCollapsedChange,
  count,
}: NoteSectionProps): JSX.Element {
  const heading: JSX.Element | null = label ? (
    collapsible ? (
      <button
        type='button'
        className='mb-3 flex w-full items-center gap-2 px-1 text-left'
        aria-expanded={!collapsed}
        onClick={(): void => onCollapsedChange?.(!collapsed)}
      >
        <Icon
          name='chevronLeft'
          size={14}
          className={`shrink-0 text-muted transition-transform ${
            collapsed ? 'rotate-180' : 'rotate-90'
          }`}
        />
        <span className='text-[11px] font-medium uppercase tracking-[0.18em] text-muted'>
          {label}
        </span>
        {count !== undefined ? (
          <span className='text-[11px] font-medium tabular-nums text-muted/80'>{count}</span>
        ) : null}
      </button>
    ) : (
      <h2 className='mb-3 px-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted'>
        {label}
      </h2>
    )
  ) : null

  return (
    <section className='mb-10'>
      {heading}
      {collapsible && collapsed ? null : children}
    </section>
  )
}
