'use client'

import { useEffect } from 'react'
import type { Note } from './types'

const CHECK_INTERVAL_MS: number = 60_000
const notifiedIds: Set<string> = new Set<string>()

/**
 * Polls for due notes and fires browser notifications when reminders are due.
 *
 * @param notes Full notes collection.
 */
export function useReminders(notes: ReadonlyArray<Note>): void {
  useEffect((): (() => void) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return (): void => undefined
    }

    const checkDue = (): void => {
      const now: number = Date.now()

      for (const note of notes) {
        if (note.trashed || note.archived || note.dueAt === null) continue
        if (note.dueAt > now) continue
        if (notifiedIds.has(note.id)) continue

        notifiedIds.add(note.id)

        if (Notification.permission === 'granted') {
          const title: string = note.title.length > 0 ? note.title : 'Reminder'
          new Notification(title, {
            body: note.content.slice(0, 120) || 'Note reminder',
            tag: note.id,
          })
        }
      }
    }

    const requestPermission = async (): Promise<void> => {
      const hasDue: boolean = notes.some(
        (note: Note): boolean =>
          !note.trashed && !note.archived && note.dueAt !== null && note.dueAt <= Date.now() + 86_400_000,
      )
      if (!hasDue) return
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
      checkDue()
    }

    void requestPermission()
    const interval: ReturnType<typeof setInterval> = setInterval(checkDue, CHECK_INTERVAL_MS)

    return (): void => clearInterval(interval)
  }, [notes])
}
