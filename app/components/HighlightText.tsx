import type { JSX, ReactNode } from 'react'
import { tokenizeSearchQuery } from '../lib/tokenizeSearchQuery'

/**
 * Props for highlighted text rendering.
 */
export interface HighlightTextProps {
  text: string
  query: string
  className?: string
}

/**
 * Renders text with search query matches wrapped in a highlight span.
 *
 * @param props.text Text to render.
 * @param props.query Active search query.
 * @param props.className Optional wrapper classes.
 */
export function HighlightText({
  text,
  query,
  className = '',
}: HighlightTextProps): JSX.Element {
  const tokens: ReadonlyArray<string> = tokenizeSearchQuery(query)

  if (tokens.length === 0 || text.length === 0) {
    return <span className={className}>{text}</span>
  }

  const pattern: string = tokens
    .map((token: string): string => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const regex: RegExp = new RegExp(`(${pattern})`, 'gi')
  const parts: string[] = text.split(regex)

  const nodes: ReactNode[] = parts.map((part: string, index: number): ReactNode => {
    const isMatch: boolean = tokens.some(
      (token: string): boolean => part.toLowerCase() === token.toLowerCase(),
    )
    if (!isMatch) return part
    return (
      <mark
        key={`${part}-${index}`}
        className='rounded-sm bg-accent/25 px-0.5 text-inherit'
      >
        {part}
      </mark>
    )
  })

  return <span className={className}>{nodes}</span>
}
