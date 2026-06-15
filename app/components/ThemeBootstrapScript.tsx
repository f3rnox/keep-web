'use client'

import type { JSX } from 'react'
import { THEME_SCRIPT } from '../lib/themeScript'

/**
 * Injects the no-FOUC theme bootstrap script during SSR only. React 19 warns
 * when inline scripts render on the client; the server HTML already contains
 * an executed copy before hydration begins.
 */
export function ThemeBootstrapScript(): JSX.Element | null {
  if (typeof window !== 'undefined') {
    return null
  }

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  )
}
