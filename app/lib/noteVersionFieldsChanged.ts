import type { Note, NoteVersionFields } from './types'
import { extractNoteVersionFields } from './extractNoteVersionFields'
import { noteVersionFieldsEqual } from './noteVersionFieldsEqual'

/**
 * Returns whether a note update changes any versioned editable fields.
 *
 * @param current Note state before the update is applied.
 * @param patch Partial fields being saved.
 */
export function noteVersionFieldsChanged(
  current: Note,
  patch: Partial<NoteVersionFields>,
): boolean {
  const before: NoteVersionFields = extractNoteVersionFields(current)
  const after: NoteVersionFields = {
    ...before,
    ...patch,
    labels: patch.labels !== undefined ? [...patch.labels] : before.labels,
    cipher:
      patch.cipher !== undefined
        ? patch.cipher === null
          ? null
          : { ...patch.cipher }
        : before.cipher,
  }

  return !noteVersionFieldsEqual(before, after)
}
