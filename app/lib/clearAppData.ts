import { LISTS_STORAGE_KEY } from './listsStorage'
import { DEFAULT_NOTE_LAYOUT } from './noteLayout'
import { clearRecentSearches } from './recentSearchesStore'
import { setLists } from './listsStore'
import { clearNotesHistory, setNotes } from './notesStore'
import { setNoteLayout } from './layoutStore'
import { setSort } from './sortStore'
import { STORAGE_KEY } from './storage'
import { saveListsToIdb } from './saveListsToIdb'
import { saveNotesToIdb } from './saveNotesToIdb'
import {
  DARK_THEME_STORAGE_KEY,
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  LIGHT_THEME_STORAGE_KEY,
} from './theme'
import { setDarkThemePreference, setLightThemePreference, setTheme } from './themeStore'
import { clearMasterPasswordVerifier } from './masterPasswordStore'
import { clearPasskeyUnlockRecord } from './passkeyUnlockStore'
import { clearAutoLockMinutes } from './autoLockStore'
import { clearAllNoteVersionsFromIdb } from './clearAllNoteVersionsFromIdb'
import { resetDefaultNoteSettings } from './defaultNoteSettingsStore'
import { lockGlobalEncryptionSession } from './globalEncryptionSession'
import { runWithoutSettingToast } from './settingToastStore'

/**
 * Removes all locally stored notes, lists, and preferences.
 */
export async function clearAppData(): Promise<void> {
  await Promise.all([
    saveNotesToIdb([]),
    saveListsToIdb([]),
    clearAllNoteVersionsFromIdb(),
  ])

  setNotes((): ReadonlyArray<never> => [], { recordHistory: false })
  setLists((): ReadonlyArray<never> => [])
  clearNotesHistory()
  clearRecentSearches()
  runWithoutSettingToast((): void => {
    setSort('updated')
    setNoteLayout(DEFAULT_NOTE_LAYOUT)
    setTheme('light')
    setLightThemePreference(DEFAULT_LIGHT_THEME)
    setDarkThemePreference(DEFAULT_DARK_THEME)
    clearMasterPasswordVerifier()
    clearPasskeyUnlockRecord()
    clearAutoLockMinutes()
    resetDefaultNoteSettings()
  })
  lockGlobalEncryptionSession()

  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(LISTS_STORAGE_KEY)
    window.localStorage.removeItem(LIGHT_THEME_STORAGE_KEY)
    window.localStorage.removeItem(DARK_THEME_STORAGE_KEY)
  } catch {
    /* ignore storage failures */
  }
}
