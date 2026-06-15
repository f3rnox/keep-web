import type { NoteList } from './types'

/**
 * Ensures a parsed list entry has the expected shape.
 *
 * @param entry Raw parsed object from storage.
 */
export function coerceList(entry: unknown): NoteList | null {
  if (typeof entry !== 'object' || entry === null) return null

  const candidate = entry as Partial<NoteList>
  if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string') {
    return null
  }

  return {
    id: candidate.id,
    name: candidate.name,
    createdAt: candidate.createdAt ?? Date.now(),
    updatedAt: candidate.updatedAt ?? Date.now(),
  }
}
