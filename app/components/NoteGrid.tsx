'use client'

import type { JSX, ReactNode } from 'react'

/**
 * Props for the masonry-style `NoteGrid`.
 */
export interface NoteGridProps {
  children: ReactNode
}

/**
 * Lightweight CSS-columns based masonry grid that mirrors Keep's tile
 * layout while keeping the implementation entirely CSS-driven.
 *
 * @param props.children Note tiles to render inside the masonry columns.
 */
export function NoteGrid({ children }: NoteGridProps): JSX.Element {
  return (
    <div className='columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5'>
      {children}
    </div>
  )
}
