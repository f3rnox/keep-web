'use client'

import { useCallback, useState, type JSX } from 'react'
import { showSettingSaved } from '../../lib/settingToastStore'
import { SettingsRow } from './SettingsRow'
import { SettingsSection } from './SettingsSection'

type NotificationPermissionState = NotificationPermission | 'unsupported'

function readNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

/**
 * Notification and reminder settings panel.
 */
export function NotificationsSettingsPanel(): JSX.Element {
  const [permission, setPermission] = useState<NotificationPermissionState>(readNotificationPermission)

  const requestPermission = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const result: NotificationPermission = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      showSettingSaved('Notifications enabled')
    }
  }, [])

  const permissionLabel: string = ((): string => {
    switch (permission) {
      case 'granted':
        return 'Allowed'
      case 'denied':
        return 'Blocked'
      case 'unsupported':
        return 'Not supported in this browser'
      default:
        return 'Not requested yet'
    }
  })()

  return (
    <div className='space-y-8'>
      <SettingsSection
        title='Due-date reminders'
        description='KeepSpark can notify you when a note or task with a due date becomes overdue.'
      >
        <SettingsRow
          label='Browser notifications'
          description='Required for reminder alerts. Notes and tasks with due dates trigger a notification once.'
        >
          <span className='text-sm text-muted'>{permissionLabel}</span>
        </SettingsRow>
      </SettingsSection>

      {permission !== 'unsupported' && permission !== 'granted' ? (
        <button
          type='button'
          onClick={(): void => {
            void requestPermission()
          }}
          className='rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover'
        >
          Enable notifications
        </button>
      ) : null}

      {permission === 'denied' ? (
        <p className='text-sm text-muted'>
          Notifications are blocked in your browser. Open site settings for this page to allow them.
        </p>
      ) : null}
    </div>
  )
}
