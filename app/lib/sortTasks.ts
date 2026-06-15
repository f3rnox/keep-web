import type { Note } from './types'

/**
 * Active and completed task buckets sorted by most recently updated.
 */
export interface SortedTasks {
  active: ReadonlyArray<Note>
  completed: ReadonlyArray<Note>
}

/**
 * Splits tasks into active and completed groups, newest first within each.
 *
 * @param tasks Task notes to order.
 */
export function sortTasks(tasks: ReadonlyArray<Note>): SortedTasks {
  const active: Note[] = []
  const completed: Note[] = []

  for (const task of tasks) {
    if (task.taskDone) completed.push(task)
    else active.push(task)
  }

  const compareActive = (a: Note, b: Note): number => {
    const dueA: number | null = a.dueAt
    const dueB: number | null = b.dueAt
    if (dueA !== null && dueB !== null) return dueA - dueB
    if (dueA !== null) return -1
    if (dueB !== null) return 1
    return b.updatedAt - a.updatedAt
  }

  const byUpdated = (a: Note, b: Note): number => b.updatedAt - a.updatedAt
  active.sort(compareActive)
  completed.sort(byUpdated)

  return { active, completed }
}
