import type { Note, NoteSort } from './types'

const COLOR_ORDER: ReadonlyArray<Note['color']> = [
  'default',
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'darkblue',
  'purple',
  'pink',
  'brown',
  'gray',
]

/**
 * Returns a copy of the supplied notes sorted by the given criterion.
 * `custom` preserves the original array order.
 *
 * @param notes Notes to sort.
 * @param sort Active sort criterion.
 */
export function sortNotes(
  notes: ReadonlyArray<Note>,
  sort: NoteSort,
): ReadonlyArray<Note> {
  if (sort === 'custom') return [...notes]

  const sorted: Note[] = [...notes]

  sorted.sort((a: Note, b: Note): number => {
    switch (sort) {
      case 'updated':
        return b.updatedAt - a.updatedAt
      case 'created':
        return b.createdAt - a.createdAt
      case 'title': {
        const titleA: string = a.title.trim().toLowerCase() || a.content.trim().toLowerCase()
        const titleB: string = b.title.trim().toLowerCase() || b.content.trim().toLowerCase()
        return titleA.localeCompare(titleB)
      }
      case 'color': {
        const indexA: number = COLOR_ORDER.indexOf(a.color)
        const indexB: number = COLOR_ORDER.indexOf(b.color)
        return indexA - indexB
      }
      case 'due': {
        const dueA: number = a.dueAt ?? Number.MAX_SAFE_INTEGER
        const dueB: number = b.dueAt ?? Number.MAX_SAFE_INTEGER
        return dueA - dueB
      }
      default:
        return 0
    }
  })

  return sorted
}
