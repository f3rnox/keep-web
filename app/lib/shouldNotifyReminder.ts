import type { Note } from './types'
import { getRemindedDueAt } from './reminderNotificationStore'

/**
 * Whether a note or task should trigger a due-date reminder right now.
 *
 * @param note Candidate note.
 * @param now Current epoch milliseconds.
 */
export function shouldNotifyReminder(note: Note, now: number): boolean {
  if (note.trashed || note.archived || note.dueAt === null) return false
  if (note.isTask && note.taskDone) return false
  if (note.dueAt > now) return false
  if (getRemindedDueAt(note.id) === note.dueAt) return false
  return true
}
