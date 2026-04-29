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
export type NoteView = 'notes' | 'archive' | 'trash'

/**
 * A single user-authored note persisted to local storage.
 */
export interface Note {
  id: string
  title: string
  content: string
  color: NoteColor
  pinned: boolean
  archived: boolean
  trashed: boolean
  createdAt: number
  updatedAt: number
}
