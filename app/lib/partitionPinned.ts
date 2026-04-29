import type { Note } from './types'

/**
 * Result of splitting a notes list into pinned and unpinned buckets.
 */
export interface PinnedPartition {
  pinned: ReadonlyArray<Note>
  others: ReadonlyArray<Note>
}

/**
 * Splits a notes array into two ordered arrays: `pinned` (notes flagged as
 * pinned) and `others` (everything else). Original ordering within each
 * bucket is preserved.
 *
 * @param notes The notes collection to partition.
 */
export function partitionPinned(notes: ReadonlyArray<Note>): PinnedPartition {
  const pinned: Note[] = []
  const others: Note[] = []

  for (const note of notes) {
    if (note.pinned) pinned.push(note)
    else others.push(note)
  }

  return { pinned, others }
}
