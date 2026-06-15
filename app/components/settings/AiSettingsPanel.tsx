'use client'

import type { ChangeEvent, JSX } from 'react'
import type { AiProvider } from '../../lib/aiSettingsStore'
import { useAiSettings } from '../../lib/useAiSettings'
import { SettingsRow } from './SettingsRow'
import { SettingsSection } from './SettingsSection'

const PROVIDER_OPTIONS: ReadonlyArray<{ value: AiProvider, label: string }> = [
  { value: 'google', label: 'Google AI (Gemini)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
]

/**
 * Settings panel for configuring AI title suggestion providers and API keys.
 */
export function AiSettingsPanel(): JSX.Element {
  const { settings, setProvider, setGoogleApiKey, setAnthropicApiKey } = useAiSettings()

  return (
    <div className='space-y-8'>
      <SettingsSection
        title='Title suggestions'
        description='Use AI to suggest short titles from your note content. API keys stay in this browser only.'
      >
        <SettingsRow
          label='Provider'
          description='Choose which service generates suggested titles.'
        >
          <select
            value={settings.provider}
            onChange={(event: ChangeEvent<HTMLSelectElement>): void =>
              setProvider(event.target.value as AiProvider)
            }
            className='rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SettingsRow>

        <SettingsRow
          label='Google AI API key'
          description='Used when Google AI is selected. Create one in Google AI Studio.'
        >
          <input
            type='password'
            value={settings.googleApiKey}
            onChange={(event: ChangeEvent<HTMLInputElement>): void =>
              setGoogleApiKey(event.target.value)
            }
            autoComplete='off'
            spellCheck={false}
            placeholder='AIza…'
            className='w-full min-w-56 rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-72'
          />
        </SettingsRow>

        <SettingsRow
          label='Anthropic API key'
          description='Used when Anthropic is selected. Create one in the Anthropic console.'
        >
          <input
            type='password'
            value={settings.anthropicApiKey}
            onChange={(event: ChangeEvent<HTMLInputElement>): void =>
              setAnthropicApiKey(event.target.value)
            }
            autoComplete='off'
            spellCheck={false}
            placeholder='sk-ant-…'
            className='w-full min-w-56 rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-72'
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  )
}
