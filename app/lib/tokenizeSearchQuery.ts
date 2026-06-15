/**
 * Splits a search query into lowercase tokens for AND matching.
 *
 * @param query Raw search input.
 */
export function tokenizeSearchQuery(query: string): ReadonlyArray<string> {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token: string): boolean => token.length > 0)
}
