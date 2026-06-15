'use client'

import { useEffect, useState } from 'react'

/**
 * Returns whether the component has mounted in the browser. Stays `false` for the
 * first client render so it matches the server-rendered HTML, then flips to `true`
 * after mount, avoiding hydration mismatches.
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState<boolean>(false)

  useEffect((): void => {
    setIsClient(true)
  }, [])

  return isClient
}
