'use client'

import { useEffect, useRef, useState, type JSX } from 'react'
import type { NoteList } from '../lib/types'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

/**
 * Props for the list move picker popover.
 */
export interface ListPickerProps {
  listId: string | null
  lists: ReadonlyArray<NoteList>
  onChange: (listId: string | null) => void
  onCreateList?: (name: string) => NoteList | null
}

/**
 * Popover menu for moving a note between the inbox and named lists.
 *
 * @param props.listId Current list assignment for the note.
 * @param props.lists Available named lists.
 * @param props.onChange Invoked with the selected list id, or `null` for inbox.
 * @param props.onCreateList Optional handler to create a list from the picker.
 */
export function ListPicker({
  listId,
  lists,
  onChange,
  onCreateList,
}: ListPickerProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(false)
  const [newName, setNewName] = useState<string>('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect((): (() => void) | void => {
    if (!open) return
    const handler = (event: MouseEvent): void => {
      if (!wrapperRef.current) return
      if (event.target instanceof Node && wrapperRef.current.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return (): void => document.removeEventListener('mousedown', handler)
  }, [open])

  const currentLabel: string =
    listId === null
      ? 'Inbox'
      : (lists.find((list: NoteList): boolean => list.id === listId)?.name ?? 'List')

  const select = (next: string | null): void => {
    onChange(next)
    setOpen(false)
  }

  const createAndMove = (): void => {
    if (!onCreateList) return
    const trimmed: string = newName.trim()
    if (trimmed.length === 0) return
    const created: NoteList | null = onCreateList(trimmed)
    if (!created) return
    setNewName('')
    select(created.id)
  }

  return (
    <div className={`relative${open ? ' z-[1]' : ''}`} ref={wrapperRef}>
      <IconButton
        label={`Move to list (${currentLabel})`}
        active={open}
        onClick={(event): void => {
          event.stopPropagation()
          setOpen((prev: boolean): boolean => !prev)
        }}
      >
        <Icon name='list' size={18} />
      </IconButton>

      {open ? (
        <div className='absolute bottom-11 left-0 z-50 w-52 rounded-xl border border-border bg-surface p-1.5 shadow-lg shadow-black/5'>
          <p className='px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted'>
            Move to
          </p>
          <button
            type='button'
            onClick={(event): void => {
              event.stopPropagation()
              select(null)
            }}
            className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-hover ${
              listId === null ? 'font-medium text-foreground' : 'text-muted'
            }`}
          >
            Inbox
          </button>
          {lists.map(
            (list: NoteList): JSX.Element => (
              <button
                key={list.id}
                type='button'
                onClick={(event): void => {
                  event.stopPropagation()
                  select(list.id)
                }}
                className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-hover ${
                  listId === list.id ? 'font-medium text-foreground' : 'text-muted'
                }`}
              >
                {list.name}
              </button>
            ),
          )}
          {onCreateList ? (
            <div className='mt-1 border-t border-border pt-1.5'>
              <div className='flex items-center gap-1 px-1.5'>
                <input
                  type='text'
                  value={newName}
                  onChange={(event): void => setNewName(event.target.value)}
                  onKeyDown={(event): void => {
                    if (event.key !== 'Enter') return
                    event.preventDefault()
                    event.stopPropagation()
                    createAndMove()
                  }}
                  placeholder='New list'
                  className='min-w-0 flex-1 bg-transparent px-1.5 py-1.5 text-xs text-foreground outline-none placeholder:text-muted'
                />
                <button
                  type='button'
                  disabled={newName.trim().length === 0}
                  onClick={(event): void => {
                    event.stopPropagation()
                    createAndMove()
                  }}
                  className='rounded-md px-2 py-1 text-xs font-medium text-foreground transition hover:bg-surface-hover disabled:opacity-40'
                >
                  Add
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
