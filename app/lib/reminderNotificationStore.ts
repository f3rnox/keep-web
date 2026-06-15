const STORAGE_KEY: string = 'keepspark:reminded-due:v1'

type RemindedDueMap = Record<string, number>

function readMap(): RemindedDueMap {
  if (typeof window === 'undefined') return {}
  const raw: string | null = window.localStorage.getItem(STORAGE_KEY)
  if (raw === null) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const map: RemindedDueMap = {}
    for (const [id, dueAt] of Object.entries(parsed)) {
      if (typeof id === 'string' && typeof dueAt === 'number') map[id] = dueAt
    }
    return map
  } catch {
    return {}
  }
}

function writeMap(map: RemindedDueMap): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

/**
 * Returns the due timestamp already notified for a note, if any.
 *
 * @param noteId Note identifier.
 */
export function getRemindedDueAt(noteId: string): number | null {
  const dueAt: number | undefined = readMap()[noteId]
  return dueAt ?? null
}

/**
 * Records that a reminder was fired for the given note and due time.
 *
 * @param noteId Note identifier.
 * @param dueAt Due timestamp that triggered the notification.
 */
export function markReminderNotified(noteId: string, dueAt: number): void {
  const map: RemindedDueMap = readMap()
  map[noteId] = dueAt
  writeMap(map)
}

/**
 * Clears stored notification state for one note, e.g. when its due date changes.
 *
 * @param noteId Note identifier.
 */
export function clearReminderNotified(noteId: string): void {
  const map: RemindedDueMap = readMap()
  if (!(noteId in map)) return
  delete map[noteId]
  writeMap(map)
}
