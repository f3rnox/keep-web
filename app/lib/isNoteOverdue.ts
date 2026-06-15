/**
 * Returns whether a due timestamp is in the past.
 *
 * @param dueAt Due date epoch milliseconds, or null.
 */
export function isNoteOverdue(dueAt: number | null): boolean {
  if (dueAt === null) return false
  return dueAt < Date.now()
}
