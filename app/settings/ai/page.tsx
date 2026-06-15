import type { JSX } from 'react'
import { AiSettingsPanel } from '../../components/settings/AiSettingsPanel'
import { SettingsShell } from '../../components/settings/SettingsShell'

/**
 * AI settings page for title suggestion providers and API keys.
 */
export default function AiSettingsPage(): JSX.Element {
  return (
    <SettingsShell
      title='AI'
      description='Configure AI providers and API keys for suggesting note titles.'
    >
      <AiSettingsPanel />
    </SettingsShell>
  )
}
