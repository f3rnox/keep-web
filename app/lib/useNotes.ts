"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Note, NoteColor } from "./types";
import { createNote } from "./createNote";
import {
  getNotesServerSnapshot,
  getNotesSnapshot,
  setNotes,
  subscribeNotes,
} from "./notesStore";

/**
 * Patch describing the partial fields that may be applied to an existing note
 * via `updateNote`. The `id`, `createdAt`, and `updatedAt` fields cannot be
 * patched directly.
 */
export type NoteUpdate = Partial<Omit<Note, "id" | "createdAt" | "updatedAt">>;

/**
 * Public API exposed by the `useNotes` hook to consumers.
 */
export interface NotesApi {
  notes: ReadonlyArray<Note>;
  addNote: (title: string, content: string, color?: NoteColor) => Note | null;
  updateNote: (id: string, patch: NoteUpdate) => void;
  togglePinned: (id: string) => void;
  setArchived: (id: string, archived: boolean) => void;
  setTrashed: (id: string, trashed: boolean) => void;
  deleteForever: (id: string) => void;
  emptyTrash: () => void;
}

/**
 * Custom hook subscribing to the shared notes store. Exposes referentially
 * stable mutators that update the underlying `localStorage`-backed snapshot.
 */
export function useNotes(): NotesApi {
  const notes: ReadonlyArray<Note> = useSyncExternalStore(
    subscribeNotes,
    getNotesSnapshot,
    getNotesServerSnapshot,
  );

  const addNote = useCallback(
    (
      title: string,
      content: string,
      color: NoteColor = "default",
    ): Note | null => {
      const trimmedTitle: string = title.trim();
      const trimmedContent: string = content.trim();
      if (trimmedTitle.length === 0 && trimmedContent.length === 0) return null;

      const note: Note = { ...createNote(trimmedTitle, trimmedContent), color };
      setNotes(
        (prev: ReadonlyArray<Note>): ReadonlyArray<Note> => [note, ...prev],
      );
      return note;
    },
    [],
  );

  const updateNote = useCallback((id: string, patch: NoteUpdate): void => {
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.map(
          (note: Note): Note =>
            note.id === id
              ? { ...note, ...patch, updatedAt: Date.now() }
              : note,
        ),
    );
  }, []);

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
    );
  }, []);

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
                  updatedAt: Date.now(),
                }
              : note,
        ),
    );
  }, []);

  const setTrashed = useCallback((id: string, trashed: boolean): void => {
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.map(
          (note: Note): Note =>
            note.id === id
              ? {
                  ...note,
                  trashed,
                  pinned: trashed ? false : note.pinned,
                  archived: trashed ? false : note.archived,
                  updatedAt: Date.now(),
                }
              : note,
        ),
    );
  }, []);

  const deleteForever = useCallback((id: string): void => {
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.filter((note: Note): boolean => note.id !== id),
    );
  }, []);

  const emptyTrash = useCallback((): void => {
    setNotes(
      (prev: ReadonlyArray<Note>): ReadonlyArray<Note> =>
        prev.filter((note: Note): boolean => !note.trashed),
    );
  }, []);

  return useMemo<NotesApi>(
    (): NotesApi => ({
      notes,
      addNote,
      updateNote,
      togglePinned,
      setArchived,
      setTrashed,
      deleteForever,
      emptyTrash,
    }),
    [
      notes,
      addNote,
      updateNote,
      togglePinned,
      setArchived,
      setTrashed,
      deleteForever,
      emptyTrash,
    ],
  );
}
