/**
 * Formats a due timestamp for compact display on note cards.
 *
 * @param dueAt Due date epoch milliseconds.
 */
export function formatDueDate(dueAt: number): string {
  const date: Date = new Date(dueAt)
  const now: Date = new Date()
  const today: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay: Date = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays: number = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000)

  const time: string = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  if (diffDays === 0) return `Today ${time}`
  if (diffDays === 1) return `Tomorrow ${time}`
  if (diffDays === -1) return `Yesterday ${time}`

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
