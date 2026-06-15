'use client'

import { useState, type ChangeEvent, type JSX } from 'react'
import { KeyboardShortcutsList } from '../KeyboardShortcutsList'
import { Icon } from '../Icon'
import { SettingsSection } from './SettingsSection'
import { resetShortcuts } from '../../lib/keyboardShortcuts'

/**
 * Reference list of keyboard shortcuts with customization controls.
 */
export function ShortcutsSettingsPanel(): JSX.Element {
  const [filterQuery, setFilterQuery] = useState<string>('')

  return (
    <div className='space-y-8'>
      <SettingsSection
        title='Shortcuts'
        description='Global shortcuts can be customized by clicking them. Context shortcuts apply in specific fields and dialogs.'
      >
        <div className='flex items-center gap-2 px-4 py-2 border-b border-border bg-canvas/30'>
          <label className='flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground shadow-sm transition focus-within:ring-2 focus-within:ring-ring'>
            <Icon name='search' size={16} className='shrink-0 text-muted' />
            <input
              type='search'
              value={filterQuery}
              onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                setFilterQuery(event.target.value)
              }
              placeholder='Filter shortcuts'
              aria-label='Filter shortcuts'
              className='min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted'
            />
          </label>
          <button
            type='button'
            onClick={resetShortcuts}
            className='shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-ring'
          >
            Reset to defaults
          </button>
        </div>
        <KeyboardShortcutsList filterQuery={filterQuery} />
      </SettingsSection>
    </div>
  )
}