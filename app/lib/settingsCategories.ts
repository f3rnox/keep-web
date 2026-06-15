import type { IconName } from '../components/Icon'

/**
 * Identifier for one settings category sub-page.
 */
export type SettingsCategoryId =
  | 'general'
  | 'appearance'
  | 'search'
  | 'notifications'
  | 'security'
  | 'sync'
  | 'data'
  | 'ai'
  | 'shortcuts'
  | 'about'

/**
 * Navigation metadata for a single settings category.
 */
export interface SettingsCategory {
  id: SettingsCategoryId
  href: string
  label: string
  description: string
  icon: IconName
}

/**
 * Ordered list of settings categories shown in the settings sidebar.
 */
export const SETTINGS_CATEGORIES: ReadonlyArray<SettingsCategory> = [
  {
    id: 'general',
    href: '/settings/general',
    label: 'General',
    description: 'Default sort order and note layout',
    icon: 'menu',
  },
  {
    id: 'appearance',
    href: '/settings/appearance',
    label: 'Appearance',
    description: 'Theme and visual preferences',
    icon: 'palette',
  },
  {
    id: 'search',
    href: '/settings/search',
    label: 'Search',
    description: 'Recent searches and query history',
    icon: 'search',
  },
  {
    id: 'notifications',
    href: '/settings/notifications',
    label: 'Notifications',
    description: 'Due-date reminders for notes and tasks',
    icon: 'bell',
  },
  {
    id: 'security',
    href: '/settings/security',
    label: 'Encryption',
    description: 'Master password for locked notes',
    icon: 'lock',
  },
  {
    id: 'sync',
    href: '/settings/sync',
    label: 'Cloud sync',
    description: 'Supabase account and cross-device sync',
    icon: 'upload',
  },
  {
    id: 'data',
    href: '/settings/data',
    label: 'Data & storage',
    description: 'Export, import, and reset local data',
    icon: 'archive',
  },
  {
    id: 'ai',
    href: '/settings/ai',
    label: 'AI',
    description: 'AI title suggestions and API keys',
    icon: 'lightbulb',
  },
  {
    id: 'shortcuts',
    href: '/settings/shortcuts',
    label: 'Keyboard shortcuts',
    description: 'Quick actions and hotkeys',
    icon: 'keyboard',
  },
  {
    id: 'about',
    href: '/settings/about',
    label: 'About',
    description: 'Version and app information',
    icon: 'lightbulb',
  },
]
