import type { Note } from './types'

/**
 * Creates a fresh, non-persisted note with the supplied title/content and
 * sensible default flags. The id is generated with `crypto.randomUUID` when
 * available, falling back to a timestamp+random hybrid for older browsers.
 *
 * @param title Initial note title.
 * @param content Initial note body content.
 */
export function createNote(title: string, content: string): Note {
  const now: number = Date.now()
  const id: string =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${now}-${Math.random().toString(36).slice(2, 10)}`

  return {
    id,
    title,
    content,
    color: 'default',
    pinned: false,
    archived: false,
    trashed: false,
    createdAt: now,
    updatedAt: now,
  }
}
