import type { Note, NoteView } from './types'

/**
 * Lower-cases and trims a search query before substring matching.
 *
 * @param query The raw search input.
 */
function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

/**
 * Filters the supplied notes down to those that belong to the given view and
 * match the (optional) full-text search query.
 *
 * @param notes The full notes collection.
 * @param view Active high-level filter (notes/archive/trash).
 * @param query Optional case-insensitive substring query.
 */
export function filterNotes(
  notes: ReadonlyArray<Note>,
  view: NoteView,
  query: string,
): ReadonlyArray<Note> {
  const normalized: string = normalizeQuery(query)

  return notes.filter((note: Note): boolean => {
    if (view === 'trash') {
      if (!note.trashed) return false
    } else if (view === 'archive') {
      if (note.trashed || !note.archived) return false
    } else {
      if (note.trashed || note.archived) return false
    }

    if (normalized.length === 0) return true

    return (
      note.title.toLowerCase().includes(normalized) ||
      note.content.toLowerCase().includes(normalized)
    )
  })
}
