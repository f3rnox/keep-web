'use client'

import { useMemo, useState, type JSX } from 'react'
import type { ListFilter, Note, NoteColor, NoteList as NamedList, NoteView } from '../lib/types'
import { filterNotes } from '../lib/filterNotes'
import { partitionPinned } from '../lib/partitionPinned'
import { useLists } from '../lib/useLists'
import { useNotes } from '../lib/useNotes'
import { EditNoteModal } from './EditNoteModal'
import { EmptyState } from './EmptyState'
import { Header } from './Header'
import { LayoutSelector } from './LayoutSelector'
import { ListBrowser } from './ListBrowser'
import { ListDetailHeader } from './ListDetailHeader'
import { NavTabs } from './NavTabs'
import { NoteCard } from './NoteCard'
import { NoteEditor } from './NoteEditor'
import { NoteList } from './NoteList'
import { NoteSection } from './NoteSection'
import { TrashBanner } from './TrashBanner'
import { useNoteLayout } from '../lib/useNoteLayout'

/**
 * Top-level KeepSpark shell. Owns view selection, search query, and the
 * currently-edited note. Delegates persistence to `useNotes` and `useLists`.
 */
export function KeepSparkApp(): JSX.Element {
  const {
    notes,
    addNote,
    updateNote,
    togglePinned,
    setArchived,
    setTrashed,
    setListId,
    deleteForever,
    emptyTrash,
  } = useNotes()

  const { lists, addList, deleteList } = useLists()

  const [view, setView] = useState<NoteView>('notes')
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [query, setQuery] = useState<string>('')
  const [editing, setEditing] = useState<Note | null>(null)
  const { layout, setLayout } = useNoteLayout()

  const selectedList: NamedList | null = useMemo<NamedList | null>((): NamedList | null => {
    if (!selectedListId) return null
    return lists.find((list: NamedList): boolean => list.id === selectedListId) ?? null
  }, [lists, selectedListId])

  const counts = useMemo<Record<NoteView, number>>(
    (): Record<NoteView, number> => ({
      notes: notes.filter(
        (note: Note): boolean => !note.trashed && !note.archived,
      ).length,
      lists: lists.length,
      archive: notes.filter((note: Note): boolean => !note.trashed && note.archived).length,
      trash: notes.filter((note: Note): boolean => note.trashed).length,
    }),
    [notes, lists],
  )

  const listFilter: ListFilter = useMemo((): ListFilter => {
    if (view === 'lists' && selectedListId) return selectedListId
    return 'all'
  }, [view, selectedListId])

  const visibleNotes: ReadonlyArray<Note> = useMemo(
    (): ReadonlyArray<Note> => filterNotes(notes, view, query, listFilter),
    [notes, view, query, listFilter],
  )

  const { pinned, others } = useMemo(
    () => partitionPinned(visibleNotes),
    [visibleNotes],
  )

  const editingNote: Note | null = useMemo<Note | null>((): Note | null => {
    if (!editing) return null
    return notes.find((note: Note): boolean => note.id === editing.id) ?? null
  }, [editing, notes])

  const handleSelectView = (next: NoteView): void => {
    setView(next)
    setSelectedListId(null)
  }

  const renderCard = (note: Note): JSX.Element => (
    <NoteCard
      key={note.id}
      note={note}
      view={view}
      lists={lists}
      onOpen={(target: Note): void => setEditing(target)}
      onTogglePinned={togglePinned}
      onSetArchived={setArchived}
      onSetTrashed={setTrashed}
      onDeleteForever={deleteForever}
      onChangeColor={(id: string, color: NoteColor): void => updateNote(id, { color })}
      onSetListId={setListId}
      onCreateList={addList}
    />
  )

  const showEditor: boolean =
    view === 'notes' || (view === 'lists' && selectedListId !== null)
  const searching: boolean = query.trim().length > 0
  const browsingLists: boolean = view === 'lists' && selectedListId === null
  const editorListId: string | null =
    view === 'lists' && selectedListId ? selectedListId : null

  const renderNotes = (): JSX.Element => {
    if (visibleNotes.length === 0) {
      return (
        <EmptyState
          view={view}
          searching={searching}
          inList={view === 'lists' && selectedListId !== null}
        />
      )
    }

    if (
      (view === 'notes' || (view === 'lists' && selectedListId)) &&
      pinned.length > 0 &&
      others.length > 0
    ) {
      return (
        <>
          <NoteSection label='Pinned'>
            <NoteList layout={layout}>{pinned.map(renderCard)}</NoteList>
          </NoteSection>
          <NoteSection label='Others'>
            <NoteList layout={layout}>{others.map(renderCard)}</NoteList>
          </NoteSection>
        </>
      )
    }

    return (
      <NoteSection>
        <NoteList layout={layout}>{visibleNotes.map(renderCard)}</NoteList>
      </NoteSection>
    )
  }

  return (
    <div className='flex min-h-full flex-1 flex-col bg-canvas text-foreground'>
      <Header query={query} onQueryChange={setQuery} />

      <div className='sticky top-16 z-20 border-b border-border bg-canvas/80 backdrop-blur'>
        <div className='mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6'>
          <NavTabs view={view} counts={counts} onSelect={handleSelectView} />
          {!browsingLists ? (
            <LayoutSelector layout={layout} onChange={setLayout} />
          ) : null}
        </div>
      </div>

      <main className='mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6'>
        {browsingLists ? (
          <>
            <ListBrowser
              lists={lists}
              notes={notes}
              onOpen={(list: NamedList): void => setSelectedListId(list.id)}
              onCreate={addList}
              onDelete={deleteList}
            />
            {lists.length === 0 ? (
              <EmptyState view='lists' searching={false} />
            ) : null}
          </>
        ) : (
          <>
            {view === 'lists' && selectedList ? (
              <ListDetailHeader
                list={selectedList}
                onBack={(): void => setSelectedListId(null)}
              />
            ) : null}

            {showEditor ? (
              <div className='mb-12'>
                <NoteEditor
                  listId={editorListId}
                  onCreate={(
                    title: string,
                    content: string,
                    color: NoteColor,
                    labels: ReadonlyArray<string>,
                    listId?: string | null,
                  ): void => {
                    addNote(title, content, color, labels, listId ?? null)
                  }}
                />
              </div>
            ) : null}

            {view === 'trash' ? (
              <TrashBanner count={counts.trash} onEmpty={emptyTrash} />
            ) : null}

            {renderNotes()}
          </>
        )}
      </main>

      {editingNote ? (
        <EditNoteModal
          note={editingNote}
          lists={lists}
          onSave={(
            id: string,
            patch: {
              title: string
              content: string
              color: NoteColor
              labels: ReadonlyArray<string>
            },
          ): void => updateNote(id, patch)}
          onTogglePinned={togglePinned}
          onSetArchived={setArchived}
          onSetTrashed={setTrashed}
          onSetListId={setListId}
          onCreateList={addList}
          onClose={(): void => setEditing(null)}
        />
      ) : null}
    </div>
  )
}
