'use client'

import { useSyncExternalStore } from 'react'

function subscribe(): () => void {
  return (): void => undefined
}

function getClientSnapshot(): boolean {
  return true
}

function getServerSnapshot(): boolean {
  return false
}

/**
 * Returns whether the component has mounted in the browser. Stays `false` for the
 * first client render so it matches the server-rendered HTML, then flips to `true`
 * after mount, avoiding hydration mismatches.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}
