'use client'

import { useState, type JSX } from 'react'
import type { NoteVersion } from '../lib/types'
import { formatVersionTimestamp } from '../lib/formatVersionTimestamp'
import { getNoteVersionPreview } from '../lib/getNoteVersionPreview'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

/**
 * Props for the per-note version history panel.
 */
export interface NoteVersionHistoryProps {
  versions: ReadonlyArray<NoteVersion>
  loading: boolean
  onRestore: (version: NoteVersion) => void
  onDelete: (version: NoteVersion) => void
}

/**
 * Lists saved note versions and lets the user restore a previous snapshot.
 *
 * @param props.versions Saved versions for the open note, newest first.
 * @param props.loading Whether versions are still loading from storage.
 * @param props.onRestore Applies the selected version to the editor.
 * @param props.onDelete Removes a saved version from history.
 */
export function NoteVersionHistory({
  versions,
  loading,
  onRestore,
  onDelete,
}: NoteVersionHistoryProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <section className='border-t border-border bg-surface px-4 py-3 sm:px-5'>
      <button
        type='button'
        className='flex w-full items-center gap-2 text-left'
        aria-expanded={open}
        onClick={(): void => setOpen((prev: boolean): boolean => !prev)}
      >
        <Icon
          name='chevronLeft'
          size={14}
          className={`shrink-0 text-muted transition-transform ${
            open ? 'rotate-90' : '-rotate-90'
          }`}
        />
        <span className='text-xs font-medium uppercase tracking-[0.14em] text-muted'>
          Version history
        </span>
        {!loading && versions.length > 0 ? (
          <span className='text-xs tabular-nums text-muted/80'>{versions.length}</span>
        ) : null}
      </button>

      {open ? (
        <div className='mt-3 space-y-2'>
          {loading ? (
            <p className='text-sm text-muted'>Loading versions…</p>
          ) : versions.length === 0 ? (
            <p className='text-sm text-muted'>
              Saved versions appear here after you edit and save this note.
            </p>
          ) : (
            versions.map(
              (version: NoteVersion): JSX.Element => (
                <div
                  key={version.id}
                  className='flex items-start justify-between gap-3 rounded-lg border border-border bg-canvas px-3 py-2.5'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium text-foreground'>
                      {getNoteVersionPreview(version)}
                    </p>
                    <p className='mt-0.5 text-xs text-muted'>
                      {formatVersionTimestamp(version.savedAt)}
                    </p>
                  </div>
                  <div className='flex shrink-0 items-center gap-1'>
                    <button
                      type='button'
                      onClick={(): void => onRestore(version)}
                      className='rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    >
                      Restore
                    </button>
                    <IconButton
                      label='Delete version'
                      className='h-8 w-8 text-muted hover:text-red-600 dark:hover:text-red-400'
                      onClick={(): void => onDelete(version)}
                    >
                      <Icon name='trash' size={16} />
                    </IconButton>
                  </div>
                </div>
              ),
            )
          )}
        </div>
      ) : null}
    </section>
  )
}
