import { THEME_DEFINITIONS, THEME_STORAGE_KEY, resolveTheme } from './theme'

/**
 * Applies the persisted or system-preferred theme before React paints.
 */
export function bootstrapTheme(): void {
  if (globalThis.window === undefined) return

  try {
    const stored: string | null = globalThis.window.localStorage.getItem(THEME_STORAGE_KEY)
    const prefersDark: boolean = globalThis.window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = resolveTheme(stored, prefersDark)
    const root: HTMLElement = document.documentElement
    const definition = THEME_DEFINITIONS[theme]

    root.dataset.theme = theme
    root.classList.toggle('dark', definition.isDark)
    root.style.colorScheme = definition.isDark ? 'dark' : 'light'
  } catch {
    /* ignore storage or media-query failures */
  }
}
