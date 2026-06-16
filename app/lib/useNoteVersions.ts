'use client'

import { useCallback, useEffect, useState } from 'react'
import type { NoteVersion } from './types'
import { loadNoteVersionsFromIdb } from './loadNoteVersionsFromIdb'
import { deleteNoteVersionFromIdb } from './deleteNoteVersionFromIdb'

/**
 * Public API for the per-note version history hook.
 */
export interface NoteVersionsApi {
  versions: ReadonlyArray<NoteVersion>
  loading: boolean
  reload: () => void
  deleteVersion: (versionId: string) => Promise<void>
}

/**
 * Loads persisted version snapshots for a single note.
 *
 * @param noteId Note whose history should be shown.
 */
export function useNoteVersions(noteId: string): NoteVersionsApi {
  const [versions, setVersions] = useState<ReadonlyArray<NoteVersion>>([])
  const [reloadToken, setReloadToken] = useState<number>(0)
  const [loadedKey, setLoadedKey] = useState<string>('')
  const requestKey: string = `${noteId}:${reloadToken}`
  const loading: boolean = loadedKey !== requestKey

  const reload = useCallback((): void => {
    setReloadToken((prev: number): number => prev + 1)
  }, [])

  const deleteVersion = useCallback(async (versionId: string): Promise<void> => {
    setVersions((prev: ReadonlyArray<NoteVersion>): ReadonlyArray<NoteVersion> =>
      prev.filter((version: NoteVersion): boolean => version.id !== versionId),
    )
    try {
      await deleteNoteVersionFromIdb(versionId)
    } catch {
      reload()
    }
  }, [reload])

  useEffect((): (() => void) | void => {
    let cancelled: boolean = false

    void loadNoteVersionsFromIdb(noteId)
      .then((loaded: ReadonlyArray<NoteVersion>): void => {
        if (cancelled) return
        setVersions(loaded)
        setLoadedKey(requestKey)
      })
      .catch((): void => {
        if (cancelled) return
        setVersions([])
        setLoadedKey(requestKey)
      })

    return (): void => {
      cancelled = true
    }
  }, [noteId, requestKey])

  return { versions, loading, reload, deleteVersion }
}
