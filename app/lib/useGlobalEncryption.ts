'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { Note } from './types'
import { isNoteEncrypted } from './isNoteEncrypted'
import { isNoteUnlockedInSession } from './encryptionSessionStore'
import {
  getGlobalEncryptionVersion,
  isGlobalEncryptionUnlocked,
  lockGlobalEncryptionSession,
  subscribeGlobalEncryption,
} from './globalEncryptionSession'
import { unlockAllEncryptedNotes } from './unlockAllEncryptedNotes'
import { hasMasterPasswordSnapshot, subscribeMasterPassword, getMasterPasswordServerSnapshot } from './masterPasswordStore'

/**
 * API exposed by the `useGlobalEncryption` hook.
 */
export interface GlobalEncryptionApi {
  hasMasterPassword: boolean
  isUnlocked: boolean
  encryptedCount: number
  unlockedCount: number
  unlockAll: (password: string) => Promise<void>
  lockAll: () => void
}

/**
 * Subscribes to global and per-note encryption session state for a note collection.
 *
 * @param notes Notes used to compute encrypted counts.
 */
export function useGlobalEncryption(notes: ReadonlyArray<Note>): GlobalEncryptionApi {
  const globalVersion: number = useSyncExternalStore(
    subscribeGlobalEncryption,
    getGlobalEncryptionVersion,
    (): number => 0,
  )

  const hasMasterPassword: boolean = useSyncExternalStore(
    subscribeMasterPassword,
    hasMasterPasswordSnapshot,
    (): boolean => getMasterPasswordServerSnapshot() !== null,
  )

  const isUnlocked: boolean = useSyncExternalStore(
    subscribeGlobalEncryption,
    isGlobalEncryptionUnlocked,
    (): boolean => false,
  )

  void globalVersion

  const encryptedNotes: ReadonlyArray<Note> = useMemo(
    (): ReadonlyArray<Note> => notes.filter((note: Note): boolean => isNoteEncrypted(note)),
    [notes],
  )

  const unlockedCount: number = useMemo((): number => {
    void globalVersion
    return encryptedNotes.filter((note: Note): boolean => isNoteUnlockedInSession(note.id)).length
  }, [encryptedNotes, globalVersion])

  const unlockAll = useCallback(async (password: string): Promise<void> => {
    await unlockAllEncryptedNotes(notes, password)
  }, [notes])

  const lockAll = useCallback((): void => {
    lockGlobalEncryptionSession()
  }, [])

  return {
    hasMasterPassword,
    isUnlocked,
    encryptedCount: encryptedNotes.length,
    unlockedCount,
    unlockAll,
    lockAll,
  }
}
