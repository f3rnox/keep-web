import { THEME_DEFINITIONS, THEME_ORDER, THEME_STORAGE_KEY } from './theme'

const VALID_THEMES: string = THEME_ORDER.map((theme: string): string => `'${theme}'`).join(',')

const DARK_THEMES: string = THEME_ORDER.filter(
  (theme): boolean => THEME_DEFINITIONS[theme].isDark,
)
  .map((theme: string): string => `'${theme}'`)
  .join(',')

/**
 * Inline theme bootstrap source used to keep theme lists in sync across tooling.
 */
export const THEME_SCRIPT: string = `(function(){try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var valid=[${VALID_THEMES}];var darkThemes=[${DARK_THEMES}];var t=s&&valid.indexOf(s)!==-1?s:(d?'dark':'light');var e=document.documentElement;var isDark=darkThemes.indexOf(t)!==-1;e.dataset.theme=t;e.classList.toggle('dark',isDark);e.style.colorScheme=isDark?'dark':'light';}catch(_){}})()`
