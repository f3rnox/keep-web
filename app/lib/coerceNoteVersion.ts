import type { NoteColor, NoteVersion } from './types'

const VALID_COLORS: ReadonlySet<string> = new Set([
  'default',
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'darkblue',
  'purple',
  'pink',
  'brown',
  'gray',
])

/**
 * Coerces a raw IndexedDB value into a `NoteVersion`, or returns null when invalid.
 *
 * @param raw Value read from IndexedDB.
 */
export function coerceNoteVersion(raw: unknown): NoteVersion | null {
  if (typeof raw !== 'object' || raw === null) return null

  const candidate: Record<string, unknown> = raw as Record<string, unknown>
  if (typeof candidate.id !== 'string' || typeof candidate.noteId !== 'string') return null
  if (typeof candidate.savedAt !== 'number' || typeof candidate.title !== 'string') return null
  if (typeof candidate.content !== 'string' || typeof candidate.encrypted !== 'boolean') {
    return null
  }

  const color: unknown = candidate.color
  if (typeof color !== 'string' || !VALID_COLORS.has(color)) return null

  const labels: unknown = candidate.labels
  if (!Array.isArray(labels)) return null
  const parsedLabels: string[] = labels.filter(
    (entry: unknown): entry is string => typeof entry === 'string',
  )

  const dueAt: number | null = typeof candidate.dueAt === 'number' ? candidate.dueAt : null

  let cipher: NoteVersion['cipher'] = null
  if (candidate.cipher !== null && typeof candidate.cipher === 'object') {
    const cipherRecord: Record<string, unknown> = candidate.cipher as Record<string, unknown>
    if (
      typeof cipherRecord.iv === 'string' &&
      typeof cipherRecord.salt === 'string' &&
      typeof cipherRecord.iterations === 'number'
    ) {
      cipher = {
        iv: cipherRecord.iv,
        salt: cipherRecord.salt,
        iterations: cipherRecord.iterations,
      }
    }
  }

  return {
    id: candidate.id,
    noteId: candidate.noteId,
    savedAt: candidate.savedAt,
    title: candidate.title,
    content: candidate.content,
    labels: parsedLabels,
    color: color as NoteColor,
    dueAt,
    encrypted: candidate.encrypted,
    cipher,
  }
}
