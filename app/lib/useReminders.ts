'use client'

import { useEffect, useRef } from 'react'
import type { Note } from './types'
import { buildReminderNotification } from './buildReminderNotification'
import { markReminderNotified } from './reminderNotificationStore'
import { shouldNotifyReminder } from './shouldNotifyReminder'

const CHECK_INTERVAL_MS: number = 60_000
const MAX_SCHEDULE_MS: number = 86_400_000

/**
 * Polls for due notes and fires browser notifications when reminders are due.
 *
 * @param notes Full notes collection.
 */
export function useReminders(notes: ReadonlyArray<Note>): void {
  const notesRef = useRef<ReadonlyArray<Note>>(notes)

  useEffect((): (() => void) => {
    notesRef.current = notes

    if (typeof window === 'undefined' || !('Notification' in window)) {
      return (): void => undefined
    }

    const timeouts: Set<ReturnType<typeof setTimeout>> = new Set()

    const fireNotification = (note: Note): void => {
      if (note.dueAt === null) return
      markReminderNotified(note.id, note.dueAt)

      if (Notification.permission !== 'granted') return

      const content = buildReminderNotification(note)
      new Notification(content.title, {
        body: content.body,
        tag: note.id,
      })
    }

    const checkDue = (): void => {
      const now: number = Date.now()

      for (const note of notesRef.current) {
        if (!shouldNotifyReminder(note, now)) continue
        fireNotification(note)
      }
    }

    const scheduleUpcoming = (): void => {
      for (const timeout of timeouts) clearTimeout(timeout)
      timeouts.clear()

      const now: number = Date.now()

      for (const note of notesRef.current) {
        if (note.trashed || note.archived || note.dueAt === null) continue
        if (note.isTask && note.taskDone) continue
        if (!shouldNotifyReminder(note, note.dueAt)) continue

        const delay: number = note.dueAt - now
        if (delay <= 0 || delay > MAX_SCHEDULE_MS) continue

        const timeout: ReturnType<typeof setTimeout> = setTimeout((): void => {
          timeouts.delete(timeout)
          const latest: Note | undefined = notesRef.current.find(
            (candidate: Note): boolean => candidate.id === note.id,
          )
          if (!latest || !shouldNotifyReminder(latest, Date.now())) return
          fireNotification(latest)
        }, delay)
        timeouts.add(timeout)
      }
    }

    const requestPermission = async (): Promise<void> => {
      const hasDue: boolean = notesRef.current.some(
        (note: Note): boolean =>
          !note.trashed &&
          !note.archived &&
          note.dueAt !== null &&
          !(note.isTask && note.taskDone) &&
          note.dueAt <= Date.now() + MAX_SCHEDULE_MS,
      )
      if (!hasDue) return
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
      checkDue()
      scheduleUpcoming()
    }

    void requestPermission()
    const interval: ReturnType<typeof setInterval> = setInterval((): void => {
      checkDue()
      scheduleUpcoming()
    }, CHECK_INTERVAL_MS)

    scheduleUpcoming()

    return (): void => {
      clearInterval(interval)
      for (const timeout of timeouts) clearTimeout(timeout)
      timeouts.clear()
    }
  }, [notes])
}
