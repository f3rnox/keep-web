import type { Note } from './types'
import { createNoteVersion } from './createNoteVersion'
import { pushNoteVersion } from './pushNoteVersion'

/**
 * Captures the current note state as a version snapshot before a save.
 *
 * @param note Note whose previous state should be stored.
 */
export async function recordNoteVersionBeforeSave(note: Note): Promise<void> {
  await pushNoteVersion(createNoteVersion(note))
}
