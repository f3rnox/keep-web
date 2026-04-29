'use client'

import { useMemo, useState, type JSX } from 'react'
import type { Note, NoteColor, NoteView } from '../lib/types'
import { filterNotes } from '../lib/filterNotes'
import { partitionPinned } from '../lib/partitionPinned'
import { useNotes } from '../lib/useNotes'
import { EditNoteModal } from './EditNoteModal'
import { EmptyState } from './EmptyState'
import { Header } from './Header'
import { NoteCard } from './NoteCard'
import { NoteEditor } from './NoteEditor'
import { NoteGrid } from './NoteGrid'
import { NoteSection } from './NoteSection'
import { Sidebar } from './Sidebar'
import { TrashBanner } from './TrashBanner'

/**
 * Top-level Google Keep clone shell. Owns view selection, sidebar collapse
 * state, search query, and the currently-edited note. Delegates persistence
 * to `useNotes`.
 */
export function KeepApp(): JSX.Element {
  const {
    notes,
    addNote,
    updateNote,
    togglePinned,
    setArchived,
    setTrashed,
    deleteForever,
    emptyTrash,
  } = useNotes()

  const [view, setView] = useState<NoteView>('notes')
  const [query, setQuery] = useState<string>('')
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false)
  const [editing, setEditing] = useState<Note | null>(null)

  const counts = useMemo<Record<NoteView, number>>(
    (): Record<NoteView, number> => ({
      notes: notes.filter((note: Note): boolean => !note.trashed && !note.archived).length,
      archive: notes.filter((note: Note): boolean => !note.trashed && note.archived).length,
      trash: notes.filter((note: Note): boolean => note.trashed).length,
    }),
    [notes],
  )

  const visibleNotes: ReadonlyArray<Note> = useMemo(
    (): ReadonlyArray<Note> => filterNotes(notes, view, query),
    [notes, view, query],
  )

  const { pinned, others } = useMemo(
    () => partitionPinned(visibleNotes),
    [visibleNotes],
  )

  const editingNote: Note | null = useMemo<Note | null>((): Note | null => {
    if (!editing) return null
    return notes.find((note: Note): boolean => note.id === editing.id) ?? null
  }, [editing, notes])

  const renderCard = (note: Note): JSX.Element => (
    <NoteCard
      key={note.id}
      note={note}
      view={view}
      onOpen={(target: Note): void => setEditing(target)}
      onTogglePinned={togglePinned}
      onSetArchived={setArchived}
      onSetTrashed={setTrashed}
      onDeleteForever={deleteForever}
      onChangeColor={(id: string, color: NoteColor): void => updateNote(id, { color })}
    />
  )

  const showEditor: boolean = view === 'notes'
  const searching: boolean = query.trim().length > 0

  return (
    <div className='flex min-h-full flex-1 flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100'>
      <Header
        query={query}
        onQueryChange={setQuery}
        onToggleSidebar={(): void =>
          setSidebarExpanded((prev: boolean): boolean => !prev)
        }
      />
      <div className='flex flex-1'>
        <Sidebar
          view={view}
          expanded={sidebarExpanded}
          counts={counts}
          onSelect={setView}
        />
        <main className='flex flex-1 flex-col px-4 py-6 sm:px-8'>
          {showEditor ? (
            <div className='mb-8'>
              <NoteEditor
                onCreate={(title: string, content: string, color: NoteColor): void => {
                  addNote(title, content, color)
                }}
              />
            </div>
          ) : null}

          {view === 'trash' ? (
            <TrashBanner count={counts.trash} onEmpty={emptyTrash} />
          ) : null}

          {visibleNotes.length === 0 ? (
            <EmptyState view={view} searching={searching} />
          ) : view === 'notes' && pinned.length > 0 && others.length > 0 ? (
            <>
              <NoteSection label='Pinned'>
                <NoteGrid>{pinned.map(renderCard)}</NoteGrid>
              </NoteSection>
              <NoteSection label='Others'>
                <NoteGrid>{others.map(renderCard)}</NoteGrid>
              </NoteSection>
            </>
          ) : (
            <NoteSection>
              <NoteGrid>{visibleNotes.map(renderCard)}</NoteGrid>
            </NoteSection>
          )}
        </main>
      </div>

      {editingNote ? (
        <EditNoteModal
          note={editingNote}
          onSave={(id: string, patch: { title: string; content: string; color: NoteColor }): void =>
            updateNote(id, patch)
          }
          onTogglePinned={togglePinned}
          onSetArchived={setArchived}
          onSetTrashed={setTrashed}
          onClose={(): void => setEditing(null)}
        />
      ) : null}
    </div>
  )
}
