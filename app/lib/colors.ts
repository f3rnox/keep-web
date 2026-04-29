import type { NoteColor } from './types'

/**
 * Mapping from a `NoteColor` token to the Tailwind background, border, and
 * hover classes that approximate the Google Keep paper palette in both light
 * and dark color schemes.
 */
export interface NoteColorClasses {
  bg: string
  hoverBg: string
  border: string
  swatch: string
}

const NOTE_COLOR_CLASSES: Record<NoteColor, NoteColorClasses> = {
  default: {
    bg: 'bg-white dark:bg-neutral-900',
    hoverBg: 'hover:bg-neutral-50 dark:hover:bg-neutral-800',
    border: 'border-neutral-200 dark:border-neutral-700',
    swatch: 'bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-950/60',
    hoverBg: 'hover:bg-red-200/70 dark:hover:bg-red-900/60',
    border: 'border-red-200 dark:border-red-900',
    swatch: 'bg-red-200 dark:bg-red-800',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-950/60',
    hoverBg: 'hover:bg-orange-200/70 dark:hover:bg-orange-900/60',
    border: 'border-orange-200 dark:border-orange-900',
    swatch: 'bg-orange-200 dark:bg-orange-800',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-950/60',
    hoverBg: 'hover:bg-yellow-200/70 dark:hover:bg-yellow-900/60',
    border: 'border-yellow-200 dark:border-yellow-900',
    swatch: 'bg-yellow-200 dark:bg-yellow-700',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-950/60',
    hoverBg: 'hover:bg-green-200/70 dark:hover:bg-green-900/60',
    border: 'border-green-200 dark:border-green-900',
    swatch: 'bg-green-200 dark:bg-green-800',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-950/60',
    hoverBg: 'hover:bg-teal-200/70 dark:hover:bg-teal-900/60',
    border: 'border-teal-200 dark:border-teal-900',
    swatch: 'bg-teal-200 dark:bg-teal-800',
  },
  blue: {
    bg: 'bg-sky-100 dark:bg-sky-950/60',
    hoverBg: 'hover:bg-sky-200/70 dark:hover:bg-sky-900/60',
    border: 'border-sky-200 dark:border-sky-900',
    swatch: 'bg-sky-200 dark:bg-sky-800',
  },
  darkblue: {
    bg: 'bg-blue-100 dark:bg-blue-950/60',
    hoverBg: 'hover:bg-blue-200/70 dark:hover:bg-blue-900/60',
    border: 'border-blue-200 dark:border-blue-900',
    swatch: 'bg-blue-300 dark:bg-blue-800',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-950/60',
    hoverBg: 'hover:bg-purple-200/70 dark:hover:bg-purple-900/60',
    border: 'border-purple-200 dark:border-purple-900',
    swatch: 'bg-purple-200 dark:bg-purple-800',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-950/60',
    hoverBg: 'hover:bg-pink-200/70 dark:hover:bg-pink-900/60',
    border: 'border-pink-200 dark:border-pink-900',
    swatch: 'bg-pink-200 dark:bg-pink-800',
  },
  brown: {
    bg: 'bg-amber-100 dark:bg-amber-950/60',
    hoverBg: 'hover:bg-amber-200/70 dark:hover:bg-amber-900/60',
    border: 'border-amber-200 dark:border-amber-900',
    swatch: 'bg-amber-300 dark:bg-amber-800',
  },
  gray: {
    bg: 'bg-neutral-100 dark:bg-neutral-800/80',
    hoverBg: 'hover:bg-neutral-200/70 dark:hover:bg-neutral-700/80',
    border: 'border-neutral-200 dark:border-neutral-700',
    swatch: 'bg-neutral-300 dark:bg-neutral-600',
  },
}

/**
 * Ordered list of every supported note color, used to render the color picker.
 */
export const NOTE_COLOR_ORDER: ReadonlyArray<NoteColor> = [
  'default',
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'darkblue',
  'purple',
  'pink',
  'brown',
  'gray',
]

/**
 * Human-readable labels for each `NoteColor`, used as tooltips/`aria-label`s.
 */
export const NOTE_COLOR_LABELS: Record<NoteColor, string> = {
  default: 'Default',
  red: 'Coral',
  orange: 'Peach',
  yellow: 'Sand',
  green: 'Sage',
  teal: 'Mint',
  blue: 'Fog',
  darkblue: 'Storm',
  purple: 'Dusk',
  pink: 'Blossom',
  brown: 'Clay',
  gray: 'Chalk',
}

/**
 * Returns the Tailwind class bundle associated with a given note color token.
 * Falls back to the `default` palette when an unknown color is passed.
 *
 * @param color The note color token to look up.
 */
export function getNoteColorClasses(color: NoteColor): NoteColorClasses {
  return NOTE_COLOR_CLASSES[color] ?? NOTE_COLOR_CLASSES.default
}
