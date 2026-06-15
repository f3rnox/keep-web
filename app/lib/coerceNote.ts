import type { Note } from './types'

/**
 * Ensures a parsed note entry has the expected shape, migrating older records.
 *
 * @param entry Raw parsed object from storage.
 */
export function coerceNote(entry: unknown): Note | null {
  if (typeof entry !== 'object' || entry === null) return null

  const candidate = entry as Partial<Note>
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.title !== 'string' ||
    typeof candidate.content !== 'string'
  ) {
    return null
  }

  const labels: ReadonlyArray<string> = Array.isArray(candidate.labels)
    ? candidate.labels.filter((label: unknown): label is string => typeof label === 'string')
    : []

  const trashed: boolean = candidate.trashed ?? false
  const trashedAt: number | null =
    typeof candidate.trashedAt === 'number'
      ? candidate.trashedAt
      : trashed
        ? (candidate.updatedAt ?? Date.now())
        : null

  const dueAt: number | null =
    typeof candidate.dueAt === 'number' ? candidate.dueAt : null

  return {
    id: candidate.id,
    title: candidate.title,
    content: candidate.content,
    labels,
    color: candidate.color ?? 'default',
    listId: typeof candidate.listId === 'string' ? candidate.listId : null,
    pinned: candidate.pinned ?? false,
    archived: candidate.archived ?? false,
    trashed,
    trashedAt,
    dueAt,
    createdAt: candidate.createdAt ?? Date.now(),
    updatedAt: candidate.updatedAt ?? Date.now(),
  }
}
