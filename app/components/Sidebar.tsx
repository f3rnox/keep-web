'use client'

import type { JSX } from 'react'
import type { NoteView } from '../lib/types'
import { Icon } from './Icon'
import type { IconName } from './Icon'

/**
 * Props for the navigation `Sidebar`.
 */
export interface SidebarProps {
  view: NoteView
  expanded: boolean
  counts: Record<NoteView, number>
  onSelect: (next: NoteView) => void
}

interface SidebarItem {
  id: NoteView
  label: string
  icon: IconName
}

const ITEMS: ReadonlyArray<SidebarItem> = [
  { id: 'notes', label: 'Notes', icon: 'lightbulb' },
  { id: 'archive', label: 'Archive', icon: 'archive' },
  { id: 'trash', label: 'Trash', icon: 'trash' },
]

/**
 * Persistent left-rail navigation that lets the user switch between the
 * Notes, Archive, and Trash views. Adapts its width based on `expanded`.
 *
 * @param props.view The currently active view.
 * @param props.expanded When true, the sidebar shows item labels in addition to icons.
 * @param props.counts Per-view counts shown next to the labels.
 * @param props.onSelect Invoked when the user picks a different view.
 */
export function Sidebar({ view, expanded, counts, onSelect }: SidebarProps): JSX.Element {
  return (
    <nav
      aria-label='Primary'
      className={`hidden shrink-0 border-r border-transparent py-3 transition-[width] duration-200 ease-out sm:block ${
        expanded ? 'w-64' : 'w-20'
      }`}
    >
      <ul className='flex flex-col gap-1'>
        {ITEMS.map((item: SidebarItem): JSX.Element => {
          const active: boolean = item.id === view
          return (
            <li key={item.id}>
              <button
                type='button'
                onClick={(): void => onSelect(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`group flex h-12 w-full items-center gap-6 rounded-r-full px-6 text-sm transition-colors ${
                  active
                    ? 'bg-amber-200/70 text-neutral-900 dark:bg-amber-300/20 dark:text-amber-100'
                    : 'text-neutral-700 hover:bg-neutral-200/70 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon name={item.icon} size={22} />
                {expanded ? (
                  <span className='flex flex-1 items-center justify-between'>
                    <span>{item.label}</span>
                    <span className='text-xs text-neutral-500 dark:text-neutral-400'>
                      {counts[item.id]}
                    </span>
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
