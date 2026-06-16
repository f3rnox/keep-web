import type { Note, NoteVersionFields } from './types'

/**
 * Extracts the fields stored in per-note version history from a note.
 *
 * @param note Note whose editable fields should be captured.
 */
export function extractNoteVersionFields(note: Note): NoteVersionFields {
  return {
    title: note.title,
    content: note.content,
    labels: [...note.labels],
    color: note.color,
    dueAt: note.dueAt,
    encrypted: note.encrypted,
    cipher:
      note.cipher === null
        ? null
        : {
            iv: note.cipher.iv,
            salt: note.cipher.salt,
            iterations: note.cipher.iterations,
          },
  }
}
