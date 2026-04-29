import type { JSX, SVGProps } from 'react'

/**
 * Identifier for one of the bundled inline SVG icons rendered by `Icon`.
 */
export type IconName =
  | 'menu'
  | 'search'
  | 'lightbulb'
  | 'archive'
  | 'unarchive'
  | 'trash'
  | 'pin'
  | 'pinFilled'
  | 'palette'
  | 'edit'
  | 'restore'
  | 'close'
  | 'check'
  | 'plus'
  | 'moreVertical'
  | 'deleteForever'

const PATHS: Record<IconName, JSX.Element> = {
  menu: (
    <path
      d='M4 7h16M4 12h16M4 17h16'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  ),
  search: (
    <>
      <circle cx='11' cy='11' r='7' />
      <path d='m20 20-3.5-3.5' strokeLinecap='round' />
    </>
  ),
  lightbulb: (
    <>
      <path d='M9 18h6' strokeLinecap='round' />
      <path d='M10 21h4' strokeLinecap='round' />
      <path d='M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.6 1 2.5v0h6v0c0-.9.3-1.8 1-2.5A6 6 0 0 0 12 3Z' />
    </>
  ),
  archive: (
    <>
      <rect x='3' y='4' width='18' height='4' rx='1' />
      <path d='M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8' />
      <path d='M10 12h4' strokeLinecap='round' />
    </>
  ),
  unarchive: (
    <>
      <rect x='3' y='4' width='18' height='4' rx='1' />
      <path d='M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8' />
      <path
        d='M12 18v-6m0 0-2.5 2.5M12 12l2.5 2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </>
  ),
  trash: (
    <>
      <path d='M4 7h16' strokeLinecap='round' />
      <path d='M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2' />
      <path d='M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7' />
      <path d='M10 11v6M14 11v6' strokeLinecap='round' />
    </>
  ),
  pin: (
    <path
      d='m12 2 7 7-3 1-1 5-3-3-5 5v-5l-5-3 5-1 1-3 4-3Z'
      strokeLinejoin='round'
    />
  ),
  pinFilled: (
    <path
      d='m12 2 7 7-3 1-1 5-3-3-5 5v-5l-5-3 5-1 1-3 4-3Z'
      fill='currentColor'
      strokeLinejoin='round'
    />
  ),
  palette: (
    <>
      <path d='M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1-1-2 .5-2 2-2h2a4 4 0 0 0 4-4 9 9 0 0 0-9-8Z' />
      <circle cx='7.5' cy='10.5' r='1' fill='currentColor' />
      <circle cx='10.5' cy='7' r='1' fill='currentColor' />
      <circle cx='14.5' cy='7' r='1' fill='currentColor' />
      <circle cx='17.5' cy='10' r='1' fill='currentColor' />
    </>
  ),
  edit: (
    <>
      <path d='M4 20h4l10-10-4-4L4 16v4Z' strokeLinejoin='round' />
      <path d='m13 6 4 4' strokeLinecap='round' />
    </>
  ),
  restore: (
    <>
      <path d='M3 12a9 9 0 1 0 3-6.7' strokeLinecap='round' />
      <path d='M3 4v5h5' strokeLinecap='round' strokeLinejoin='round' />
    </>
  ),
  close: (
    <path
      d='M6 6l12 12M18 6 6 18'
      strokeLinecap='round'
    />
  ),
  check: (
    <path
      d='m5 12 5 5L20 7'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  ),
  plus: (
    <path d='M12 5v14M5 12h14' strokeLinecap='round' />
  ),
  moreVertical: (
    <>
      <circle cx='12' cy='5' r='1.5' fill='currentColor' />
      <circle cx='12' cy='12' r='1.5' fill='currentColor' />
      <circle cx='12' cy='19' r='1.5' fill='currentColor' />
    </>
  ),
  deleteForever: (
    <>
      <path d='M4 7h16' strokeLinecap='round' />
      <path d='M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2' />
      <path d='M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7' />
      <path d='m10 11 4 6m0-6-4 6' strokeLinecap='round' />
    </>
  ),
}

/**
 * Props accepted by the `Icon` component.
 */
export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

/**
 * Renders one of the bundled inline SVG icons. The icon is `currentColor`
 * driven for stroke, so the parent's `text-*` color controls its appearance.
 *
 * @param props Icon name, optional size override, and any extra SVG props.
 */
export function Icon({ name, size = 20, ...rest }: IconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.7}
      aria-hidden='true'
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
