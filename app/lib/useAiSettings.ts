'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { AiProvider, AiSettings } from './aiSettingsStore'
import {
  getAiSettingsServerSnapshot,
  getAiSettingsSnapshot,
  setAiSettings,
  subscribeAiSettings,
} from './aiSettingsStore'

/**
 * Public API for the AI settings hook.
 */
export interface AiSettingsApi {
  settings: AiSettings
  setProvider: (provider: AiProvider) => void
  setGoogleApiKey: (key: string) => void
  setAnthropicApiKey: (key: string) => void
}

/**
 * Subscribes to persisted AI provider and API key settings.
 */
export function useAiSettings(): AiSettingsApi {
  const settings: AiSettings = useSyncExternalStore(
    subscribeAiSettings,
    getAiSettingsSnapshot,
    getAiSettingsServerSnapshot,
  )

  const setProvider = useCallback((provider: AiProvider): void => {
    setAiSettings({ provider })
  }, [])

  const setGoogleApiKey = useCallback((googleApiKey: string): void => {
    setAiSettings({ googleApiKey })
  }, [])

  const setAnthropicApiKey = useCallback((anthropicApiKey: string): void => {
    setAiSettings({ anthropicApiKey })
  }, [])

  return useMemo<AiSettingsApi>(
    (): AiSettingsApi => ({
      settings,
      setProvider,
      setGoogleApiKey,
      setAnthropicApiKey,
    }),
    [settings, setProvider, setGoogleApiKey, setAnthropicApiKey],
  )
}
