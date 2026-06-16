'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { DefaultNoteSettings } from './defaultNoteSettingsStore'
import {
  getDefaultNoteSettingsServerSnapshot,
  getDefaultNoteSettingsSnapshot,
  setDefaultListId,
  setListPresetLabels,
  subscribeDefaultNoteSettings,
} from './defaultNoteSettingsStore'

/**
 * Public API for the default note settings hook.
 */
export interface DefaultNoteSettingsApi {
  settings: DefaultNoteSettings
  setDefaultListId: (listId: string | null) => void
  setListPresetLabels: (listKey: string, labels: ReadonlyArray<string>) => void
}

/**
 * Subscribes to persisted default list and per-list preset label settings.
 */
export function useDefaultNoteSettings(): DefaultNoteSettingsApi {
  const settings: DefaultNoteSettings = useSyncExternalStore(
    subscribeDefaultNoteSettings,
    getDefaultNoteSettingsSnapshot,
    getDefaultNoteSettingsServerSnapshot,
  )

  const updateDefaultListId = useCallback((listId: string | null): void => {
    setDefaultListId(listId)
  }, [])

  const updateListPresetLabels = useCallback(
    (listKey: string, labels: ReadonlyArray<string>): void => {
      setListPresetLabels(listKey, labels)
    },
    [],
  )

  return useMemo<DefaultNoteSettingsApi>(
    (): DefaultNoteSettingsApi => ({
      settings,
      setDefaultListId: updateDefaultListId,
      setListPresetLabels: updateListPresetLabels,
    }),
    [settings, updateDefaultListId, updateListPresetLabels],
  )
}
