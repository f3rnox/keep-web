import type { NoteVersion } from './types'
import type { EditNoteSavePatch } from './types'

/**
 * Converts a stored note version into an edit-modal save patch.
 *
 * @param version Version snapshot to restore.
 */
export function noteVersionToSavePatch(version: NoteVersion): EditNoteSavePatch {
  return {
    title: version.title,
    content: version.content,
    color: version.color,
    labels: [...version.labels],
    dueAt: version.dueAt,
    encrypted: version.encrypted,
    cipher:
      version.cipher === null
        ? null
        : {
            iv: version.cipher.iv,
            salt: version.cipher.salt,
            iterations: version.cipher.iterations,
          },
  }
}
