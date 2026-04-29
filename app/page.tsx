import type { JSX } from 'react'
import { KeepApp } from './components/KeepApp'

/**
 * Root route for the Google Keep clone. Renders the client-side app shell
 * which owns all interactive state and persistence.
 */
export default function Home(): JSX.Element {
  return <KeepApp />
}
