'use client'

import type { JSX } from 'react'
import { KeyboardShortcutsList } from '../KeyboardShortcutsList'
import { SettingsSection } from './SettingsSection'
import { resetShortcuts } from '../../lib/keyboardShortcuts'

/**
 * Reference list of keyboard shortcuts with customization controls.
 */
export function ShortcutsSettingsPanel(): JSX.Element {
  return (
    <div className='space-y-8'>
      <SettingsSection
        title='Shortcuts'
        description='Available when focus is not inside a text field, unless noted otherwise. Click any shortcut to configure it.'
      >
        <div className='flex justify-end px-4 py-2 border-b border-border bg-canvas/30'>
          <button
            type='button'
            onClick={resetShortcuts}
            className='rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-ring'
          >
            Reset to defaults
          </button>
        </div>
        <KeyboardShortcutsList />
      </SettingsSection>
    </div>
  )
}
