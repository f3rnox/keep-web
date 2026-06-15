import type { Note } from './types'
import { tokenizeSearchQuery } from './tokenizeSearchQuery'

/**
 * Returns whether a note matches all search tokens across title, content, labels,
 * and optionally its list name.
 *
 * @param note Note to test.
 * @param query Raw search input.
 * @param listName Optional list name to include in matching.
 */
export function matchesSearchQuery(
  note: Note,
  query: string,
  listName: string | null = null,
): boolean {
  const tokens: ReadonlyArray<string> = tokenizeSearchQuery(query)
  if (tokens.length === 0) return true

  const haystack: string = [
    note.title,
    note.content,
    ...note.labels,
    listName ?? '',
  ]
    .join(' ')
    .toLowerCase()

  return tokens.every((token: string): boolean => haystack.includes(token))
}
