'use client'

import type { JSX } from 'react'
import type { NoteView } from '../lib/types'
import { Icon, type IconName } from './Icon'

/**
 * Props for the `EmptyState` placeholder.
 */
export interface EmptyStateProps {
  view: NoteView
  searching: boolean
}

interface EmptyConfig {
  icon: IconName
  title: string
}

const EMPTY: Record<NoteView, EmptyConfig> = {
  notes: { icon: 'lightbulb', title: 'Notes you add appear here' },
  archive: { icon: 'archive', title: 'Your archived notes appear here' },
  trash: { icon: 'trash', title: 'No notes in Trash' },
}

/**
 * Renders a friendly placeholder when the active view has no notes to show,
 * adapting its message based on whether the user is searching or simply has
 * an empty bucket.
 *
 * @param props.view The current view, controlling icon/title.
 * @param props.searching True when a search query is active.
 */
export function EmptyState({ view, searching }: EmptyStateProps): JSX.Element {
  const config = EMPTY[view]
  const title: string = searching ? 'No matching notes found' : config.title

  return (
    <div className='flex flex-col items-center justify-center px-6 py-24 text-center text-neutral-500 dark:text-neutral-400'>
      <span className='mb-4 text-neutral-300 dark:text-neutral-700'>
        <Icon name={config.icon} size={96} strokeWidth={1} />
      </span>
      <p className='text-lg'>{title}</p>
    </div>
  )
}
