import Markdown from 'react-markdown'
import type { JSX, ReactNode } from 'react'
import { HighlightText } from './HighlightText'

/**
 * Props for the `MarkdownBody` renderer.
 */
export interface MarkdownBodyProps {
  content: string
  className?: string
  searchQuery?: string
  onNoteLinkClick?: (title: string) => void
}

const MARKDOWN_PROSE_CLASS: string =
  'leading-relaxed text-inherit [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_h1]:mt-3 [&_h1]:mb-1 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mt-2.5 [&_h2]:mb-1 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_p]:m-0 [&_p+p]:mt-2 [&_strong]:font-semibold [&_em]:italic [&_img]:my-2 [&_img]:max-h-48 [&_img]:rounded-lg [&_img]:object-cover [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2'

/**
 * Renders note body text as markdown inside a styled container.
 */
export function MarkdownBody({
  content,
  className = '',
  searchQuery = '',
  onNoteLinkClick,
}: MarkdownBodyProps): JSX.Element | null {
  if (content.length === 0) return null

  const highlightChildren = (children: ReactNode): ReactNode => {
    if (typeof children === 'string') {
      return <HighlightText text={children} query={searchQuery} />
    }
    return children
  }

  return (
    <div className={`${MARKDOWN_PROSE_CLASS} ${className}`.trim()}>
      <Markdown
        components={{
          p: ({ children }): JSX.Element => <p>{highlightChildren(children)}</p>,
          a: ({ href, children }): JSX.Element => {
            if (href?.startsWith('note:') && onNoteLinkClick) {
              const title: string = decodeURIComponent(href.slice(5))
              return (
                <button
                  type='button'
                  className='text-accent underline underline-offset-2'
                  onClick={(event): void => {
                    event.stopPropagation()
                    onNoteLinkClick(title)
                  }}
                >
                  {children}
                </button>
              )
            }
            return (
              <a href={href} target='_blank' rel='noopener noreferrer'>
                {children}
              </a>
            )
          },
          img: ({ src, alt }): JSX.Element => (
            // eslint-disable-next-line @next/next/no-img-element -- data URLs from pasted images
            <img src={src} alt={alt ?? 'image'} className='max-w-full' />
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
