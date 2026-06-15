'use client'

import { useCallback, useMemo, useRef, useState, type JSX } from 'react'
import type {
  ListFilter,
  Note,
  NoteColor,
  NoteCipher,
  NoteList as NamedList,
  NoteView,
  SearchScope,
} from '../lib/types'
import { collectLabels } from '../lib/collectLabels'
import { filterNotes } from '../lib/filterNotes'
import { findNoteByTitle } from '../lib/findNoteByTitle'
import { partitionPinned } from '../lib/partitionPinned'
import { partitionNotesAndTasks } from '../lib/partitionNotesAndTasks'
import { sortTasks } from '../lib/sortTasks'
import { isNoteEncrypted } from '../lib/isNoteEncrypted'
import { reorderNotesInSection } from '../lib/reorderNotesInSection'
import { sortNotes } from '../lib/sortNotes'
import { setSort } from '../lib/sortStore'
import { useAppShortcuts } from '../lib/useAppShortcuts'
import { useAutoLock } from '../lib/useAutoLock'
import { useLists } from '../lib/useLists'
import { useNotes } from '../lib/useNotes'
import { useRecentSearches } from '../lib/useRecentSearches'
import { useReminders } from '../lib/useReminders'
import { useSortPreference } from '../lib/useSortPreference'
import { BulkActionBar } from './BulkActionBar'
import { ConfirmModal } from './ConfirmModal'
import { EditNoteModal, type EditNoteSavePatch } from './EditNoteModal'
import { EmptyState } from './EmptyState'
import { AppSidebar } from './AppSidebar'
import { Header } from './Header'
import { LabelFilter } from './LabelFilter'
import { LayoutSelector } from './LayoutSelector'
import { EditorPaneSelector } from './EditorPaneSelector'
import { ListDetailHeader } from './ListDetailHeader'
import { NoteCard } from './NoteCard'
import { NoteEditor, type NoteEditorHandle } from './NoteEditor'
import { NoteList } from './NoteList'
import { NoteSection } from './NoteSection'
import { SearchScopeSelector } from './SearchScopeSelector'
import { SortSelector } from './SortSelector'
import { TrashBanner } from './TrashBanner'
import { TaskCard } from './TaskCard'
import { TaskComposer } from './TaskComposer'
import { TaskList } from './TaskList'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { useNoteLayout } from '../lib/useNoteLayout'
import { useMediaQuery } from '../lib/useMediaQuery'

/**
 * Props for the KeepSpark app shell.
 */
export interface KeepSparkAppProps {
  initialQuery?: string
}

/**
 * Pending confirmation shown before irreversible delete actions.
 */
interface ConfirmRequest {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
}

/**
 * Top-level KeepSpark shell. Owns view selection, search query, and the
 * currently-edited note. Delegates persistence to `useNotes` and `useLists`.
 */
export function KeepSparkApp({ initialQuery = '' }: KeepSparkAppProps): JSX.Element {
  const {
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
  } = useNotes()

  const { lists, addList, updateList, deleteList } = useLists()
  const { sort, setSort: setSortPreference } = useSortPreference()
  const { recents, commitSearch, removeRecent, clearRecents } = useRecentSearches()

  useReminders(notes)
  useAutoLock()

  const [view, setView] = useState<NoteView>('notes')
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [query, setQuery] = useState<string>(initialQuery)
  const [searchScope, setSearchScope] = useState<SearchScope>('view')
  const [labelFilter, setLabelFilter] = useState<string | null>(null)
  const [editing, setEditing] = useState<Note | null>(null)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState<boolean>(false)
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const { layout, setLayout, editorPane, setEditorPane } = useNoteLayout()
  const isDesktop: boolean = useMediaQuery('(min-width: 1024px)')

  const searchRef = useRef<HTMLInputElement | null>(null)
  const editorRef = useRef<NoteEditorHandle | null>(null)
  const dragNoteIdRef = useRef<string | null>(null)

  const selectedList: NamedList | null = useMemo<NamedList | null>((): NamedList | null => {
    if (!selectedListId) return null
    return lists.find((list: NamedList): boolean => list.id === selectedListId) ?? null
  }, [lists, selectedListId])

  const listNameById: Map<string, string> = useMemo((): Map<string, string> => {
    const map: Map<string, string> = new Map()
    for (const list of lists) map.set(list.id, list.name)
    return map
  }, [lists])

  const counts = useMemo(
    (): { notes: number, archive: number, trash: number } => ({
      notes: notes.filter(
        (note: Note): boolean => !note.trashed && !note.archived,
      ).length,
      archive: notes.filter((note: Note): boolean => !note.trashed && note.archived).length,
      trash: notes.filter((note: Note): boolean => note.trashed).length,
    }),
    [notes],
  )

  const listFilter: ListFilter = useMemo((): ListFilter => {
    if (view === 'lists' && selectedListId) return selectedListId
    return 'all'
  }, [view, selectedListId])

  const filteredNotes: ReadonlyArray<Note> = useMemo(
    (): ReadonlyArray<Note> =>
      filterNotes(notes, {
        view,
        query,
        listFilter,
        labelFilter,
        searchScope,
        selectedListId,
        listNameById,
      }),
    [notes, view, query, listFilter, labelFilter, searchScope, selectedListId, listNameById],
  )

  const { tasks: filteredTasks, notes: filteredRegularNotes } = useMemo(
    (): ReturnType<typeof partitionNotesAndTasks> => partitionNotesAndTasks(filteredNotes),
    [filteredNotes],
  )

  const sortedTasks = useMemo(
    (): ReturnType<typeof sortTasks> => sortTasks(filteredTasks),
    [filteredTasks],
  )

  const sortedNoteItems: ReadonlyArray<Note> = useMemo(
    (): ReadonlyArray<Note> => sortNotes(filteredRegularNotes, sort),
    [filteredRegularNotes, sort],
  )

  const { pinned, others } = useMemo(
    () => partitionPinned(sortedNoteItems),
    [sortedNoteItems],
  )

  const hasTasks: boolean = sortedTasks.active.length + sortedTasks.completed.length > 0

  const availableLabels: ReadonlyArray<string> = useMemo((): ReadonlyArray<string> => {
    const active: ReadonlyArray<Note> = notes.filter(
      (note: Note): boolean => !note.trashed && !note.archived,
    )
    return collectLabels(active)
  }, [notes])

  const editingNote: Note | null = useMemo<Note | null>((): Note | null => {
    if (!editing) return null
    return notes.find((note: Note): boolean => note.id === editing.id) ?? null
  }, [editing, notes])

  const splitEditorActive: boolean =
    editorPane === 'split' && isDesktop && editingNote !== null

  const selectionActive: boolean = selectionMode || selectedIds.size > 0

  const clearSelection = useCallback((): void => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [])

  const toggleSelect = useCallback((id: string): void => {
    setSelectedIds((prev: ReadonlySet<string>): ReadonlySet<string> => {
      const next: Set<string> = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectNotes = (): void => {
    setView('notes')
    setSelectedListId(null)
    setLabelFilter(null)
    clearSelection()
    setSidebarOpen(false)
  }

  const handleSelectList = (listId: string): void => {
    setView('lists')
    setSelectedListId(listId)
    setLabelFilter(null)
    clearSelection()
    setSidebarOpen(false)
  }

  const handleSelectArchive = (): void => {
    setView('archive')
    setSelectedListId(null)
    setLabelFilter(null)
    clearSelection()
    setSidebarOpen(false)
  }

  const handleSelectTrash = (): void => {
    setView('trash')
    setSelectedListId(null)
    setLabelFilter(null)
    clearSelection()
    setSidebarOpen(false)
  }

  const handleNoteDrop = useCallback(
    (sectionNotes: ReadonlyArray<Note>, targetId: string): void => {
      const fromId: string | null = dragNoteIdRef.current
      if (fromId === null || fromId === targetId) return
      const orderedIds: ReadonlyArray<string> = reorderNotesInSection(
        notes,
        sectionNotes,
        fromId,
        targetId,
      )
      reorderNotes(orderedIds)
      setSort('custom')
      setSortPreference('custom')
      dragNoteIdRef.current = null
    },
    [notes, reorderNotes, setSortPreference],
  )

  const handleOpenNoteLink = useCallback(
    (title: string): void => {
      const target: Note | null = findNoteByTitle(notes, title)
      if (target) setEditing(target)
    },
    [notes],
  )

  const closeConfirm = useCallback((): void => setConfirmRequest(null), [])

  const requestMoveToTrash = useCallback(
    (id: string): void => {
      const note: Note | undefined = notes.find((item: Note): boolean => item.id === id)
      const title: string =
        note !== undefined && note.title.trim().length > 0 ? note.title.trim() : 'Untitled note'

      setConfirmRequest({
        title: 'Move to trash?',
        description: `"${title}" will be moved to trash. You can restore it from the Trash view.`,
        confirmLabel: 'Move to trash',
        onConfirm: (): void => {
          setTrashed(id, true)
          if (editing?.id === id) setEditing(null)
          setConfirmRequest(null)
        },
      })
    },
    [notes, setTrashed, editing],
  )

  const requestSetTrashed = useCallback(
    (id: string, trashed: boolean): void => {
      if (!trashed) {
        setTrashed(id, false)
        return
      }
      requestMoveToTrash(id)
    },
    [setTrashed, requestMoveToTrash],
  )

  const requestBulkMoveToTrash = useCallback((): void => {
    const count: number = selectedIds.size
    const ids: ReadonlyArray<string> = [...selectedIds]

    setConfirmRequest({
      title: count === 1 ? 'Move note to trash?' : `Move ${count} notes to trash?`,
      description:
        count === 1
          ? 'This note will be moved to trash. You can restore it from the Trash view.'
          : `These ${count} notes will be moved to trash. You can restore them from the Trash view.`,
      confirmLabel: 'Move to trash',
      onConfirm: (): void => {
        bulkSetTrashed(ids, true)
        clearSelection()
        setConfirmRequest(null)
      },
    })
  }, [selectedIds, bulkSetTrashed, clearSelection])

  const requestDeleteForever = useCallback(
    (id: string): void => {
      const note: Note | undefined = notes.find((item: Note): boolean => item.id === id)
      const title: string =
        note !== undefined && note.title.trim().length > 0 ? note.title.trim() : 'Untitled note'

      setConfirmRequest({
        title: 'Delete note permanently?',
        description: `"${title}" will be removed forever. This cannot be undone.`,
        confirmLabel: 'Delete forever',
        onConfirm: (): void => {
          deleteForever(id)
          setConfirmRequest(null)
        },
      })
    },
    [notes, deleteForever],
  )

  const requestBulkDeleteForever = useCallback((): void => {
    const count: number = selectedIds.size
    const ids: ReadonlyArray<string> = [...selectedIds]

    setConfirmRequest({
      title: count === 1 ? 'Delete note permanently?' : `Delete ${count} notes permanently?`,
      description:
        count === 1
          ? 'This note will be removed forever. This cannot be undone.'
          : `These ${count} notes will be removed forever. This cannot be undone.`,
      confirmLabel: 'Delete forever',
      onConfirm: (): void => {
        bulkDeleteForever(ids)
        clearSelection()
        setConfirmRequest(null)
      },
    })
  }, [selectedIds, bulkDeleteForever, clearSelection])

  const requestDeleteList = useCallback(
    (id: string): void => {
      const list: NamedList | undefined = lists.find((item: NamedList): boolean => item.id === id)
      const name: string = list?.name ?? 'this list'
      const noteCount: number = notes.filter(
        (note: Note): boolean => note.listId === id && !note.trashed,
      ).length

      setConfirmRequest({
        title: `Delete "${name}"?`,
        description:
          noteCount > 0
            ? `The list will be removed. ${noteCount} note${noteCount === 1 ? '' : 's'} will stay in your library without this list.`
            : 'This list will be removed. This cannot be undone.',
        confirmLabel: 'Delete list',
        onConfirm: (): void => {
          deleteList(id)
          if (selectedListId === id) {
            setSelectedListId(null)
            setView('notes')
          }
          setConfirmRequest(null)
        },
      })
    },
    [lists, notes, deleteList, selectedListId],
  )

  const requestEmptyTrash = useCallback((): void => {
    const count: number = counts.trash

    setConfirmRequest({
      title: 'Empty trash?',
      description:
        count === 1
          ? '1 note in trash will be permanently deleted. This cannot be undone.'
          : `${count} notes in trash will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Empty trash',
      onConfirm: (): void => {
        emptyTrash()
        setConfirmRequest(null)
      },
    })
  }, [counts.trash, emptyTrash])

  const closeModal = useCallback((): void => setEditing(null), [])

  const handleSearchCommit = useCallback(
    (value: string): void => {
      commitSearch(value)
    },
    [commitSearch],
  )

  useAppShortcuts({
    onNewNote: (): void => {
      if (view !== 'notes' && !(view === 'lists' && selectedListId)) return
      editorRef.current?.expand()
    },
    onFocusSearch: (): void => searchRef.current?.focus(),
    onCloseModal: closeModal,
    onTogglePin: (): void => {
      if (editingNote) togglePinned(editingNote.id)
    },
    onUndo: undo,
    onRedo: redo,
    onClearSelection: clearSelection,
    modalOpen: editingNote !== null,
    selectionActive,
  })

  const renderTaskCard = (task: Note): JSX.Element => {
    const listName: string | null =
      task.listId !== null ? (listNameById.get(task.listId) ?? null) : null

    return (
      <TaskCard
        key={task.id}
        note={task}
        view={view}
        lists={lists}
        listName={view === 'notes' ? listName : null}
        searchQuery={query}
        onToggleDone={toggleTaskDone}
        onUpdateTitle={(id: string, title: string): void => updateNote(id, { title })}
        onSetTrashed={requestSetTrashed}
        onSetArchived={setArchived}
        onDeleteForever={requestDeleteForever}
        onSetListId={setListId}
        onSetDueAt={setDueAt}
        onCreateList={addList}
      />
    )
  }

  const renderTasks = (): JSX.Element | null => {
    if (!hasTasks) return null

    return (
      <NoteSection label='Tasks'>
        <TaskList>
          {sortedTasks.active.map(renderTaskCard)}
          {sortedTasks.completed.length > 0 ? (
            <p className='px-1 pt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted'>
              Completed
            </p>
          ) : null}
          {sortedTasks.completed.map(renderTaskCard)}
        </TaskList>
      </NoteSection>
    )
  }

  const renderCard = (note: Note, sectionNotes: ReadonlyArray<Note>): JSX.Element => {
    const listName: string | null =
      note.listId !== null ? (listNameById.get(note.listId) ?? null) : null

    return (
      <NoteCard
        key={note.id}
        note={note}
        view={view}
        lists={lists}
        listName={view === 'notes' ? listName : null}
        searchQuery={query}
        selected={selectedIds.has(note.id)}
        selectionActive={selectionActive}
        draggable={!editingNote && !selectionActive}
        onOpen={(target: Note): void => setEditing(target)}
        onToggleSelect={toggleSelect}
        onTogglePinned={togglePinned}
        onSetArchived={setArchived}
        onSetTrashed={requestSetTrashed}
        onDeleteForever={requestDeleteForever}
        onChangeColor={(id: string, color: NoteColor): void => updateNote(id, { color })}
        onSetListId={setListId}
        onCreateList={addList}
        onContentChange={(id: string, nextContent: string): void => {
          const target: Note | undefined = notes.find((note: Note): boolean => note.id === id)
          if (target && isNoteEncrypted(target)) return
          updateNote(id, { content: nextContent }, { recordHistory: false })
        }}
        onLabelClick={(label: string): void => {
          setView('notes')
          setSelectedListId(null)
          setLabelFilter(label)
        }}
        onNoteLinkClick={handleOpenNoteLink}
        onDragStart={(id: string): void => {
          dragNoteIdRef.current = id
        }}
        onDrop={(targetId: string): void => handleNoteDrop(sectionNotes, targetId)}
      />
    )
  }

  const showEditor: boolean =
    view === 'notes' || (view === 'lists' && selectedListId !== null)
  const searching: boolean = query.trim().length > 0
  const editorListId: string | null =
    view === 'lists' && selectedListId ? selectedListId : null

  const selectedIdList: ReadonlyArray<string> = useMemo(
    (): ReadonlyArray<string> => [...selectedIds],
    [selectedIds],
  )

  const renderNotes = (): JSX.Element => {
    if (sortedNoteItems.length === 0) {
      if (hasTasks) return <></>
      return (
        <EmptyState
          view={view}
          searching={searching || labelFilter !== null}
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
            <NoteList layout={layout}>{pinned.map((note: Note) => renderCard(note, pinned))}</NoteList>
          </NoteSection>
          <NoteSection label='Others'>
            <NoteList layout={layout}>{others.map((note: Note) => renderCard(note, others))}</NoteList>
          </NoteSection>
        </>
      )
    }

    return (
      <NoteSection>
        <NoteList layout={layout}>
          {sortedNoteItems.map((note: Note) => renderCard(note, sortedNoteItems))}
        </NoteList>
      </NoteSection>
    )
  }

  return (
    <div className='flex min-h-full flex-1 flex-col bg-canvas text-foreground'>
      <Header
        ref={searchRef}
        query={query}
        recents={recents}
        onQueryChange={setQuery}
        onSearchCommit={handleSearchCommit}
        onSelectRecent={setQuery}
        onRemoveRecent={removeRecent}
        onClearRecents={clearRecents}
      />

      <div className='flex min-h-0 flex-1'>
        {sidebarOpen ? (
          <button
            type='button'
            aria-label='Close navigation'
            className='fixed inset-0 z-30 bg-black/40 lg:hidden'
            onClick={(): void => setSidebarOpen(false)}
          />
        ) : null}

        <AppSidebar
          view={view}
          selectedListId={selectedListId}
          lists={lists}
          notes={notes}
          notesCount={counts.notes}
          archiveCount={counts.archive}
          trashCount={counts.trash}
          onSelectNotes={handleSelectNotes}
          onSelectList={handleSelectList}
          onSelectArchive={handleSelectArchive}
          onSelectTrash={handleSelectTrash}
          onCreateList={addList}
          onDeleteList={requestDeleteList}
          onDropNote={(listId: string, noteId: string): void => setListId(noteId, listId)}
          className={`fixed bottom-0 left-0 top-14 z-40 transition-transform sm:top-16 lg:sticky lg:top-16 lg:z-0 lg:max-h-[calc(100vh-4rem)] lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        />

        <div className='flex min-w-0 flex-1 flex-col'>
          <div className='sticky top-14 z-20 border-b border-border bg-canvas/80 backdrop-blur sm:top-16'>
            <div className='mx-auto w-full max-w-6xl px-3 sm:px-6'>
              <div className='flex items-center justify-end gap-1 overflow-x-auto py-2 sm:gap-2'>
                <IconButton
                  label='Open navigation'
                  className='lg:hidden'
                  onClick={(): void => setSidebarOpen(true)}
                >
                  <Icon name='menu' size={18} />
                </IconButton>
                {query.trim().length > 0 ? (
                  <SearchScopeSelector
                    scope={searchScope}
                    inList={view === 'lists' && selectedListId !== null}
                    onChange={setSearchScope}
                  />
                ) : null}
                <SortSelector sort={sort} onChange={setSortPreference} />
                <LayoutSelector layout={layout} onChange={setLayout} />
                <EditorPaneSelector editorPane={editorPane} onChange={setEditorPane} />
                <IconButton
                  label={selectionMode ? 'Exit selection mode' : 'Select notes'}
                  active={selectionMode}
                  onClick={(): void => {
                    if (selectionMode) clearSelection()
                    else setSelectionMode(true)
                  }}
                >
                  <Icon name='check' size={18} />
                </IconButton>
                <IconButton label='Undo' onClick={undo} disabled={!canUndo}>
                  <Icon name='restore' size={18} />
                </IconButton>
                <IconButton label='Redo' onClick={redo} disabled={!canRedo}>
                  <Icon name='chevronLeft' size={18} className='rotate-180' />
                </IconButton>
              </div>
              {view !== 'trash' ? (
                <LabelFilter
                  labels={availableLabels}
                  selected={labelFilter}
                  onSelect={setLabelFilter}
                />
              ) : null}
            </div>
          </div>

          <main
            className={`mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-6 sm:py-10${selectionActive ? ' pb-28 sm:pb-10' : ''}${splitEditorActive ? ' lg:pr-[min(480px,42vw)]' : ''}`}
          >
            {view === 'lists' && selectedList ? (
              <ListDetailHeader
                list={selectedList}
                onRename={(id: string, name: string): void => updateList(id, { name })}
              />
            ) : null}

            {showEditor ? (
              <div className='mb-8 space-y-3 sm:mb-12'>
                <NoteEditor
                  ref={editorRef}
                  listId={editorListId}
                  onCreate={(
                    title: string,
                    content: string,
                    color: NoteColor,
                    labels: ReadonlyArray<string>,
                    listId?: string | null,
                    encryption?: { encrypted: boolean, cipher: NoteCipher | null },
                    dueAt?: number | null,
                  ): Note | null =>
                    addNote(title, content, color, labels, listId ?? null, encryption, dueAt ?? null)
                  }
                />
                <TaskComposer
                  listId={editorListId}
                  onCreate={(title: string, listId?: string | null, dueAt?: number | null): void => {
                    addTask(title, listId ?? null, dueAt ?? null)
                  }}
                />
              </div>
            ) : null}

            {view === 'trash' ? (
              <TrashBanner count={counts.trash} onEmpty={requestEmptyTrash} />
            ) : null}

            {renderTasks()}
            {renderNotes()}
          </main>
        </div>
      </div>

      <BulkActionBar
        count={selectedIds.size}
        lists={lists}
        view={view}
        onClear={clearSelection}
        onArchive={(): void => {
          bulkSetArchived(selectedIdList, true)
          clearSelection()
        }}
        onTrash={requestBulkMoveToTrash}
        onRestore={(): void => {
          bulkSetTrashed(selectedIdList, false)
          clearSelection()
        }}
        onDeleteForever={requestBulkDeleteForever}
        onMoveToList={(listId: string | null): void => {
          bulkSetListId(selectedIdList, listId)
          clearSelection()
        }}
        onChangeColor={(color: NoteColor): void => {
          bulkUpdate(selectedIdList, { color })
          clearSelection()
        }}
        onCreateList={addList}
      />

      {confirmRequest ? (
        <ConfirmModal
          title={confirmRequest.title}
          description={confirmRequest.description}
          confirmLabel={confirmRequest.confirmLabel}
          destructive
          onConfirm={confirmRequest.onConfirm}
          onCancel={closeConfirm}
        />
      ) : null}

      {editingNote ? (
        <EditNoteModal
          key={editingNote.id}
          note={editingNote}
          notes={notes}
          lists={lists}
          presentation={splitEditorActive ? 'panel' : 'overlay'}
          onSave={(id: string, patch: EditNoteSavePatch): void => updateNote(id, patch)}
          onTogglePinned={togglePinned}
          onSetArchived={setArchived}
          onSetTrashed={requestSetTrashed}
          onSetListId={setListId}
          onCreateList={addList}
          onOpenNote={(note: Note): void => setEditing(note)}
          onClose={closeModal}
        />
      ) : null}
    </div>
  )
}
