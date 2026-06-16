import type { NoteVersion } from './types'

/**
 * Returns a short label for a version row in the history list.
 *
 * @param version Stored note version snapshot.
 */
export function getNoteVersionPreview(version: NoteVersion): string {
  const title: string = version.title.trim()
  if (title.length > 0) return title

  if (version.encrypted) return 'Encrypted note'

  const snippet: string = version.content.trim().replace(/\s+/g, ' ').slice(0, 80)
  return snippet.length > 0 ? snippet : 'Empty note'
}
