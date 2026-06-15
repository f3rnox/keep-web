import type { Note } from './types'

export interface ReminderNotificationContent {
  title: string
  body: string
}

/**
 * Builds browser notification title and body for a due note or task.
 *
 * @param note Note or task that is due.
 */
export function buildReminderNotification(note: Note): ReminderNotificationContent {
  const title: string =
    note.title.length > 0 ? note.title : note.isTask ? 'Task reminder' : 'Reminder'

  if (note.encrypted) {
    return {
      title,
      body: note.isTask ? 'Encrypted task reminder' : 'Encrypted note reminder',
    }
  }

  if (note.isTask) {
    return {
      title,
      body: 'Task reminder',
    }
  }

  return {
    title,
    body: note.content.slice(0, 120) || 'Note reminder',
  }
}
