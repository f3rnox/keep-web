'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { Note, NoteColor, NoteCipher } from './types'
import { createNote } from './createNote'
import { createTask } from './createTask'
import { deleteNoteVersionsForNote } from './deleteNoteVersionsForNote'
import { noteVersionFieldsChanged } from './noteVersionFieldsChanged'
import { recordNoteVersionBeforeSave } from './recordNoteVersionBeforeSave'
import { clearReminderNotified } from './reminderNotificationStore'
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
    encryption?: { encrypted: boolean, cipher: NoteCipher | null },
    dueAt?: number | null,
  ) => Note | null
  addTask: (title: string, listId?: string | null, dueAt?: number | null) => Note | null
  toggleTaskDone: (id: string) => void
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
      encryption?: { encrypted: boolean, cipher: NoteCipher | null },
      dueAt: number | null = null,
    ): Note | null => {
      const trimmedTitle: string = title.trim()
      const trimmedContent: string = content.trim()
      const isEncrypted: boolean = encryption?.encrypted === true
      if (!isEncrypted && trimmedTitle.length === 0 && trimmedContent.length === 0) return null

      const note: Note = {
        ...createNote(trimmedTitle, trimmedContent),
        color,
        labels,
        listId,
        dueAt,
        encrypted: isEncrypted,
        cipher: isEncrypted ? encryption?.cipher ?? null : null,
      }
      setNotes(
        (prev: ReadonlyArray<Note>): ReadonlyArray<Note> => [note, ...prev],
      )
      return note
    },
    [],
  )

  const addTask = useCallback(
    (title: string, listId: string | null = null, dueAt: number | null = null): Note | null => {
      const trimmed: string = title.trim()
      if (trimmed.length === 0) return null

      const task: Note = {
        ...createTask(trimmed, listId),
        dueAt,
      }
      setNotes(
        (prev: ReadonlyArray<Note>): ReadonlyArray<Note> => [task, ...prev],
      )
      return task
    },
    [],
  )

  const toggleTaskDone = useCallback((id: string): void => {
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.map(
          (note: Note): Note =>
            note.id === id && note.isTask
              ? {
                  ...note,
                  taskDone: !note.taskDone,
                  updatedAt: Date.now(),
                }
              : note,
        ),
    )
  }, [])

  const updateNote = useCallback(
    (id: string, patch: NoteUpdate, options?: { recordHistory?: boolean }): void => {
      if ('dueAt' in patch) clearReminderNotified(id)

      const shouldRecordVersion: boolean = options?.recordHistory !== false
      if (shouldRecordVersion) {
        const current: Note | undefined = getNotesSnapshot().find(
          (note: Note): boolean => note.id === id,
        )
        if (current !== undefined && noteVersionFieldsChanged(current, patch)) {
          void recordNoteVersionBeforeSave(current)
        }
      }

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
    clearReminderNotified(id)
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.map(
          (note: Note): Note =>
            note.id === id ? { ...note, dueAt, updatedAt: Date.now() } : note,
        ),
    )
  }, [])

  const deleteForever = useCallback((id: string): void => {
    void deleteNoteVersionsForNote(id)
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.filter((note: Note): boolean => note.id !== id),
    )
  }, [])

  const emptyTrash = useCallback((): void => {
    for (const note of getNotesSnapshot()) {
      if (note.trashed) void deleteNoteVersionsForNote(note.id)
    }
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
    for (const id of ids) void deleteNoteVersionsForNote(id)
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
      addTask,
      toggleTaskDone,
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
      addTask,
      toggleTaskDone,
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
