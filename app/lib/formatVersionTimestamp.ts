/**
 * Formats a version timestamp for display in the history list.
 *
 * @param savedAt Epoch milliseconds when the version was saved.
 */
export function formatVersionTimestamp(savedAt: number): string {
  return new Date(savedAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
