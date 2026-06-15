import type { ListFilter, Note, NoteView, SearchScope } from './types'
import { matchesSearchQuery } from './matchesSearchQuery'

/**
 * Options for filtering the notes collection.
 */
export interface FilterNotesOptions {
  view: NoteView
  query: string
  listFilter?: ListFilter
  labelFilter?: string | null
  searchScope?: SearchScope
  selectedListId?: string | null
  listNameById?: ReadonlyMap<string, string>
}

/**
 * Returns whether a note matches the supplied list filter.
 *
 * @param note Note to test.
 * @param listFilter Scope controlling list membership.
 */
function matchesListFilter(note: Note, listFilter: ListFilter): boolean {
  if (listFilter === 'all') return true
  if (listFilter === 'inbox') return note.listId === null
  return note.listId === listFilter
}

/**
 * Returns whether a note belongs to the active search scope.
 *
 * @param note Note to test.
 * @param scope Search scope override.
 * @param view Current UI view.
 * @param listFilter List filter for the current view.
 * @param selectedListId Currently opened list id.
 */
function matchesSearchScope(
  note: Note,
  scope: SearchScope,
  view: NoteView,
  listFilter: ListFilter,
  selectedListId: string | null,
): boolean {
  switch (scope) {
    case 'all':
      return !note.trashed && !note.archived
    case 'list':
      if (selectedListId === null) return !note.trashed && !note.archived
      return !note.trashed && !note.archived && note.listId === selectedListId
    case 'archive':
      return !note.trashed && note.archived
    case 'trash':
      return note.trashed
    case 'view':
    default:
      if (view === 'trash') return note.trashed
      if (view === 'archive') return !note.trashed && note.archived
      if (note.trashed || note.archived) return false
      return matchesListFilter(note, listFilter)
  }
}

/**
 * Filters the supplied notes down to those that belong to the given view and
 * match optional search, label, and scope criteria.
 *
 * @param notes The full notes collection.
 * @param options Filter configuration.
 */
export function filterNotes(
  notes: ReadonlyArray<Note>,
  options: FilterNotesOptions,
): ReadonlyArray<Note>
/**
 * Legacy positional-args overload for backwards compatibility.
 */
export function filterNotes(
  notes: ReadonlyArray<Note>,
  view: NoteView,
  query: string,
  listFilter?: ListFilter,
  labelFilter?: string | null,
): ReadonlyArray<Note>
export function filterNotes(
  notes: ReadonlyArray<Note>,
  viewOrOptions: NoteView | FilterNotesOptions,
  query: string = '',
  listFilter: ListFilter = 'all',
  labelFilter: string | null = null,
): ReadonlyArray<Note> {
  const options: FilterNotesOptions =
    typeof viewOrOptions === 'object'
      ? viewOrOptions
      : {
          view: viewOrOptions,
          query,
          listFilter,
          labelFilter,
          searchScope: 'view',
        }

  const {
    view,
    query: searchQuery,
    listFilter: listScope = 'all',
    labelFilter: label = null,
    searchScope = 'view',
    selectedListId = null,
    listNameById = new Map<string, string>(),
  } = options

  const hasQuery: boolean = searchQuery.trim().length > 0
  const effectiveScope: SearchScope =
    hasQuery && searchScope !== 'view' ? searchScope : 'view'

  return notes.filter((note: Note): boolean => {
    if (!matchesSearchScope(note, effectiveScope, view, listScope, selectedListId)) {
      return false
    }

    if (label !== null) {
      const hasLabel: boolean = note.labels.some(
        (entry: string): boolean => entry.toLowerCase() === label.toLowerCase(),
      )
      if (!hasLabel) return false
    }

    const listName: string | null =
      note.listId !== null ? (listNameById.get(note.listId) ?? null) : null

    return matchesSearchQuery(note, searchQuery, listName)
  })
}
