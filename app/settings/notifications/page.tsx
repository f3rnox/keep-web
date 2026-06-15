import type { JSX } from 'react'
import { NotificationsSettingsPanel } from '../../components/settings/NotificationsSettingsPanel'
import { SettingsShell } from '../../components/settings/SettingsShell'

/**
 * Notifications settings page for due-date reminders.
 */
export default function NotificationsSettingsPage(): JSX.Element {
  return (
    <SettingsShell
      title='Notifications'
      description='Control browser notifications for note and task reminders.'
    >
      <NotificationsSettingsPanel />
    </SettingsShell>
  )
}
