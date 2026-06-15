/**
 * Identifier for one of the predefined Keep-style note background colors.
 */
export type NoteColor =
  | 'default'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'darkblue'
  | 'purple'
  | 'pink'
  | 'brown'
  | 'gray'

/**
 * The high-level filter the user is currently viewing.
 */
export type NoteView = 'notes' | 'lists' | 'archive' | 'trash'

/**
 * Layout used to render the note collection.
 */
export type NoteLayout = 'grid' | 'stacked'

/**
 * Scope applied when filtering notes by list membership.
 */
export type ListFilter = 'inbox' | 'all' | string

/**
 * Sort order applied to visible notes.
 */
export type NoteSort = 'updated' | 'created' | 'title' | 'color' | 'due' | 'custom'

/**
 * Scope for full-text search across note collections.
 */
export type SearchScope = 'view' | 'all' | 'list' | 'archive' | 'trash'

/**
 * A user-defined named list used to group notes.
 */
export interface NoteList {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

/**
 * A single user-authored note persisted to local storage.
 */
export interface Note {
  id: string
  title: string
  content: string
  labels: ReadonlyArray<string>
  color: NoteColor
  listId: string | null
  pinned: boolean
  archived: boolean
  trashed: boolean
  trashedAt: number | null
  dueAt: number | null
  createdAt: number
  updatedAt: number
}
