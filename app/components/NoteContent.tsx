'use client'

import type { JSX, ReactNode } from 'react'
import { expandWikiLinks } from '../lib/expandWikiLinks'
import { toggleChecklistLine } from '../lib/toggleChecklistLine'
import { MarkdownBody } from './MarkdownBody'

/**
 * Props for the rich note content renderer.
 */
export interface NoteContentProps {
  content: string
  className?: string
  interactive?: boolean
  searchQuery?: string
  onContentChange?: (next: string) => void
  onNoteLinkClick?: (title: string) => void
}

const CHECKLIST_UNCHECKED: RegExp = /^(\s*[-*]\s+)\[ \](\s*)(.*)$/
const CHECKLIST_CHECKED: RegExp = /^(\s*[-*]\s+)\[x\](\s*)(.*)$/i

/**
 * Renders note body with interactive checklists, wiki links, and markdown.
 *
 * @param props.content Raw markdown content.
 * @param props.className Optional wrapper classes.
 * @param props.interactive Enables checklist toggles.
 * @param props.onContentChange Called when a checklist item is toggled.
 * @param props.onNoteLinkClick Called when a wiki link is clicked.
 */
export function NoteContent({
  content,
  className = '',
  interactive = false,
  searchQuery = '',
  onContentChange,
  onNoteLinkClick,
}: NoteContentProps): JSX.Element | null {
  if (content.length === 0) return null

  const lines: string[] = content.split('\n')
  const nodes: ReactNode[] = []
  let markdownBuffer: string[] = []
  let bufferStart: number = 0
  let checklistBuffer: ReactNode[] = []

  const flushChecklist = (): void => {
    if (checklistBuffer.length === 0) return
    nodes.push(
      <div key={`checklist-${nodes.length}`} className='my-1 space-y-0.5'>
        {checklistBuffer}
      </div>,
    )
    checklistBuffer = []
  }

  const flushMarkdown = (endIndex: number): void => {
    flushChecklist()
    if (markdownBuffer.length === 0) return
    const block: string = markdownBuffer.join('\n')
    nodes.push(
      <MarkdownBody
        key={`md-${bufferStart}`}
        content={expandWikiLinks(block)}
        className=''
        searchQuery={searchQuery}
        onNoteLinkClick={onNoteLinkClick}
      />,
    )
    markdownBuffer = []
    bufferStart = endIndex
  }

  lines.forEach((line: string, index: number): void => {
    const unchecked: RegExpMatchArray | null = line.match(CHECKLIST_UNCHECKED)
    const checked: RegExpMatchArray | null = line.match(CHECKLIST_CHECKED)

    if (unchecked !== null || checked !== null) {
      flushMarkdown(index)
      const isChecked: boolean = checked !== null
      const label: string = (checked?.[3] ?? unchecked?.[3] ?? '').trim()

      checklistBuffer.push(
        <label
          key={`check-${index}`}
          className={`flex items-start gap-2 py-0.5 ${interactive ? 'cursor-pointer' : ''}`}
          onClick={(event): void => {
            if (!interactive || !onContentChange) return
            event.stopPropagation()
            event.preventDefault()
            onContentChange(toggleChecklistLine(content, index))
          }}
        >
          <input
            type='checkbox'
            checked={isChecked}
            readOnly
            tabIndex={-1}
            aria-label={label.length > 0 ? label : 'Checklist item'}
            className='pointer-events-none mt-1 h-3.5 w-3.5 shrink-0 accent-accent'
          />
          <span className={isChecked ? 'text-muted line-through' : ''}>{label}</span>
        </label>,
      )
      bufferStart = index + 1
      return
    }

    flushChecklist()
    if (markdownBuffer.length === 0) bufferStart = index
    markdownBuffer.push(line)
  })

  flushChecklist()
  flushMarkdown(lines.length)

  return <div className={className}>{nodes}</div>
}
