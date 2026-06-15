'use client'

import { useLayoutEffect, type JSX } from 'react'
import { bootstrapTheme } from '../lib/bootstrapTheme'

/**
 * Applies the saved theme on the first client paint without a layout script tag.
 */
export function ThemeBootstrap(): JSX.Element | null {
  useLayoutEffect((): void => {
    bootstrapTheme()
  }, [])

  return null
}
