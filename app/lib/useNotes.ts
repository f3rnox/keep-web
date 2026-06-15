'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { Note, NoteColor } from './types'
import { createNote } from './createNote'
import { reorderByIds } from './reorderByIds'
import {
  canRedoNotes,
  canUndoNotes,
  getNotesHistoryVersion,
  getNotesServerSnapshot,
  getNotesSnapshot,
  redoNotes,
  setNotes,
  subscribeNotes,
  subscribeNotesHistory,
  undoNotes,
} from './notesStore'

/**
 * Patch describing the partial fields that may be applied to an existing note
 * via `updateNote`. The `id`, `createdAt`, and `updatedAt` fields cannot be
 * patched directly.
 */
export type NoteUpdate = Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>

/**
 * Public API exposed by the `useNotes` hook to consumers.
 */
export interface NotesApi {
  notes: ReadonlyArray<Note>
  canUndo: boolean
  canRedo: boolean
  addNote: (
    title: string,
    content: string,
    color?: NoteColor,
    labels?: ReadonlyArray<string>,
    listId?: string | null,
  ) => Note | null
  updateNote: (id: string, patch: NoteUpdate, options?: { recordHistory?: boolean }) => void
  togglePinned: (id: string) => void
  setArchived: (id: string, archived: boolean) => void
  setTrashed: (id: string, trashed: boolean) => void
  setListId: (id: string, listId: string | null) => void
  setDueAt: (id: string, dueAt: number | null) => void
  deleteForever: (id: string) => void
  emptyTrash: () => void
  reorderNotes: (orderedIds: ReadonlyArray<string>) => void
  bulkUpdate: (ids: ReadonlyArray<string>, patch: NoteUpdate) => void
  bulkSetTrashed: (ids: ReadonlyArray<string>, trashed: boolean) => void
  bulkSetArchived: (ids: ReadonlyArray<string>, archived: boolean) => void
  bulkSetListId: (ids: ReadonlyArray<string>, listId: string | null) => void
  bulkDeleteForever: (ids: ReadonlyArray<string>) => void
  undo: () => void
  redo: () => void
}

/**
 * Custom hook subscribing to the shared notes store. Exposes referentially
 * stable mutators that update the underlying IndexedDB-backed snapshot.
 */
export function useNotes(): NotesApi {
  const notes: ReadonlyArray<Note> = useSyncExternalStore(
    subscribeNotes,
    getNotesSnapshot,
    getNotesServerSnapshot,
  )

  const historyVersion: number = useSyncExternalStore(
    subscribeNotesHistory,
    getNotesHistoryVersion,
    (): number => 0,
  )

  const canUndo: boolean = canUndoNotes()
  const canRedo: boolean = canRedoNotes()

  void historyVersion

  const addNote = useCallback(
    (
      title: string,
      content: string,
      color: NoteColor = 'default',
      labels: ReadonlyArray<string> = [],
      listId: string | null = null,
    ): Note | null => {
      const trimmedTitle: string = title.trim()
      const trimmedContent: string = content.trim()
      if (trimmedTitle.length === 0 && trimmedContent.length === 0) return null

      const note: Note = {
        ...createNote(trimmedTitle, trimmedContent),
        color,
        labels,
        listId,
      }
      setNotes(
        (prev: ReadonlyArray<Note>): ReadonlyArray<Note> => [note, ...prev],
      )
      return note
    },
    [],
  )

  const updateNote = useCallback(
    (id: string, patch: NoteUpdate, options?: { recordHistory?: boolean }): void => {
      setNotes(
        (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
          prev.map(
            (note: Note): Note =>
              note.id === id
                ? { ...note, ...patch, updatedAt: Date.now() }
                : note,
          ),
        { recordHistory: options?.recordHistory },
      )
    },
    [],
  )

  const togglePinned = useCallback((id: string): void => {
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.map(
          (note: Note): Note =>
            note.id === id
              ? {
                  ...note,
                  pinned: !note.pinned,
                  archived: false,
                  updatedAt: Date.now(),
                }
              : note,
        ),
    )
  }, [])

  const setArchived = useCallback((id: string, archived: boolean): void => {
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.map(
          (note: Note): Note =>
            note.id === id
              ? {
                  ...note,
                  archived,
                  pinned: archived ? false : note.pinned,
                  trashed: false,
                  trashedAt: null,
                  updatedAt: Date.now(),
                }
              : note,
        ),
    )
  }, [])

  const setTrashed = useCallback((id: string, trashed: boolean): void => {
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.map(
          (note: Note): Note =>
            note.id === id
              ? {
                  ...note,
                  trashed,
                  trashedAt: trashed ? Date.now() : null,
                  pinned: trashed ? false : note.pinned,
                  archived: trashed ? false : note.archived,
                  updatedAt: Date.now(),
                }
              : note,
        ),
    )
  }, [])

  const setListId = useCallback((id: string, listId: string | null): void => {
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.map(
          (note: Note): Note =>
            note.id === id
              ? { ...note, listId, updatedAt: Date.now() }
              : note,
        ),
    )
  }, [])

  const setDueAt = useCallback((id: string, dueAt: number | null): void => {
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.map(
          (note: Note): Note =>
            note.id === id ? { ...note, dueAt, updatedAt: Date.now() } : note,
        ),
    )
  }, [])

  const deleteForever = useCallback((id: string): void => {
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.filter((note: Note): boolean => note.id !== id),
    )
  }, [])

  const emptyTrash = useCallback((): void => {
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.filter((note: Note): boolean => !note.trashed),
    )
  }, [])

  const reorderNotes = useCallback((orderedIds: ReadonlyArray<string>): void => {
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        reorderByIds(prev, orderedIds, (note: Note): string => note.id),
    )
  }, [])

  const bulkUpdate = useCallback((ids: ReadonlyArray<string>, patch: NoteUpdate): void => {
    const idSet: Set<string> = new Set(ids)
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.map(
          (note: Note): Note =>
            idSet.has(note.id)
              ? { ...note, ...patch, updatedAt: Date.now() }
              : note,
        ),
    )
  }, [])

  const bulkSetTrashed = useCallback((ids: ReadonlyArray<string>, trashed: boolean): void => {
    const idSet: Set<string> = new Set(ids)
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.map(
          (note: Note): Note =>
            idSet.has(note.id)
              ? {
                  ...note,
                  trashed,
                  trashedAt: trashed ? Date.now() : null,
                  pinned: trashed ? false : note.pinned,
                  archived: trashed ? false : note.archived,
                  updatedAt: Date.now(),
                }
              : note,
        ),
    )
  }, [])

  const bulkSetArchived = useCallback((ids: ReadonlyArray<string>, archived: boolean): void => {
    const idSet: Set<string> = new Set(ids)
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.map(
          (note: Note): Note =>
            idSet.has(note.id)
              ? {
                  ...note,
                  archived,
                  pinned: archived ? false : note.pinned,
                  trashed: false,
                  trashedAt: null,
                  updatedAt: Date.now(),
                }
              : note,
        ),
    )
  }, [])

  const bulkSetListId = useCallback((ids: ReadonlyArray<string>, listId: string | null): void => {
    const idSet: Set<string> = new Set(ids)
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.map(
          (note: Note): Note =>
            idSet.has(note.id)
              ? { ...note, listId, updatedAt: Date.now() }
              : note,
        ),
    )
  }, [])

  const bulkDeleteForever = useCallback((ids: ReadonlyArray<string>): void => {
    const idSet: Set<string> = new Set(ids)
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.filter((note: Note): boolean => !idSet.has(note.id)),
    )
  }, [])

  const undo = useCallback((): void => {
    undoNotes()
  }, [])

  const redo = useCallback((): void => {
    redoNotes()
  }, [])

  return useMemo<NotesApi>(
    (): NotesApi => ({
      notes,
      canUndo,
      canRedo,
      addNote,
      updateNote,
      togglePinned,
      setArchived,
      setTrashed,
      setListId,
      setDueAt,
      deleteForever,
      emptyTrash,
      reorderNotes,
      bulkUpdate,
      bulkSetTrashed,
      bulkSetArchived,
      bulkSetListId,
      bulkDeleteForever,
      undo,
      redo,
    }),
    [
      notes,
      canUndo,
      canRedo,
      addNote,
      updateNote,
      togglePinned,
      setArchived,
      setTrashed,
      setListId,
      setDueAt,
      deleteForever,
      emptyTrash,
      reorderNotes,
      bulkUpdate,
      bulkSetTrashed,
      bulkSetArchived,
      bulkSetListId,
      bulkDeleteForever,
      undo,
      redo,
    ],
  )
}
