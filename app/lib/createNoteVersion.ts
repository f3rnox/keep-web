import type { Note, NoteVersion } from './types'
import { extractNoteVersionFields } from './extractNoteVersionFields'

/**
 * Creates a version snapshot from the current note state.
 *
 * @param note Note to snapshot before a save.
 */
export function createNoteVersion(note: Note): NoteVersion {
  const id: string =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  return {
    id,
    noteId: note.id,
    savedAt: Date.now(),
    ...extractNoteVersionFields(note),
  }
}
