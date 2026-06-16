'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import {
  getTasksSectionCollapsedServerSnapshot,
  getTasksSectionCollapsedSnapshot,
  setTasksSectionCollapsed,
  subscribeTasksSectionCollapsed,
} from './tasksSectionStore'

/**
 * Public API for the tasks section collapsed preference hook.
 */
export interface TasksSectionCollapsedApi {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
}

/**
 * Subscribes to the persisted tasks section collapsed preference.
 */
export function useTasksSectionCollapsed(): TasksSectionCollapsedApi {
  const collapsed: boolean = useSyncExternalStore(
    subscribeTasksSectionCollapsed,
    getTasksSectionCollapsedSnapshot,
    getTasksSectionCollapsedServerSnapshot,
  )

  const setCollapsed = useCallback((next: boolean): void => {
    setTasksSectionCollapsed(next)
  }, [])

  const toggleCollapsed = useCallback((): void => {
    setTasksSectionCollapsed(!getTasksSectionCollapsedSnapshot())
  }, [])

  return useMemo<TasksSectionCollapsedApi>(
    (): TasksSectionCollapsedApi => ({ collapsed, setCollapsed, toggleCollapsed }),
    [collapsed, setCollapsed, toggleCollapsed],
  )
}
