'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearchesServerSnapshot,
  getRecentSearchesSnapshot,
  removeRecentSearch,
  subscribeRecentSearches,
} from './recentSearchesStore'

/**
 * Public API for recent search persistence.
 */
export interface RecentSearchesApi {
  recents: ReadonlyArray<string>
  commitSearch: (query: string) => void
  removeRecent: (query: string) => void
  clearRecents: () => void
}

/**
 * Subscribes to the persisted recent searches list.
 */
export function useRecentSearches(): RecentSearchesApi {
  const recents: ReadonlyArray<string> = useSyncExternalStore(
    subscribeRecentSearches,
    getRecentSearchesSnapshot,
    getRecentSearchesServerSnapshot,
  )

  const commitSearch = useCallback((query: string): void => {
    addRecentSearch(query)
  }, [])

  const removeRecent = useCallback((query: string): void => {
    removeRecentSearch(query)
  }, [])

  const clearRecents = useCallback((): void => {
    clearRecentSearches()
  }, [])

  return useMemo<RecentSearchesApi>(
    (): RecentSearchesApi => ({
      recents,
      commitSearch,
      removeRecent,
      clearRecents,
    }),
    [recents, commitSearch, removeRecent, clearRecents],
  )
}
