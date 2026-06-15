import type { MarkdownFormatResult } from './applyMarkdownFormat'
import { applyChecklistFormat } from './applyChecklistFormat'

/**
 * Markdown formatting actions supported by the note editor toolbar.
 */
export type MarkdownFormat = 'bold' | 'italic' | 'h1' | 'h2' | 'h3' | 'checklist'

/**
 * Result of applying a markdown transform to a textarea value.
 */
export interface MarkdownFormatResult {
  value: string
  selectionStart: number
  selectionEnd: number
}

/**
 * Applies a markdown formatting transform to the textarea value around the
 * current selection (or inserts placeholder text when nothing is selected).
 *
 * @param value Current textarea value.
 * @param selectionStart Start of the active selection.
 * @param selectionEnd End of the active selection.
 * @param format Formatting action to apply.
 */
export function applyMarkdownFormat(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  format: MarkdownFormat,
): MarkdownFormatResult {
  if (format === 'bold' || format === 'italic') {
    const marker: string = format === 'bold' ? '**' : '*'
    const placeholder: string = 'text'
    const selected: string = value.slice(selectionStart, selectionEnd)
    const inner: string = selected.length > 0 ? selected : placeholder
    const wrapped: string = `${marker}${inner}${marker}`
    const newValue: string =
      value.slice(0, selectionStart) + wrapped + value.slice(selectionEnd)
    const start: number = selectionStart + marker.length
    const end: number = start + inner.length
    return { value: newValue, selectionStart: start, selectionEnd: end }
  }

  if (format === 'checklist') {
    return applyChecklistFormat(value, selectionStart, selectionEnd)
  }

  const lineStart: number = value.lastIndexOf('\n', selectionStart - 1) + 1
  const lineEndIdx: number = value.indexOf('\n', selectionEnd)
  const lineEnd: number = lineEndIdx === -1 ? value.length : lineEndIdx
  const line: string = value.slice(lineStart, lineEnd)
  const stripped: string = line.replace(/^#{1,3}\s+/, '')
  const prefix: string = format === 'h1' ? '# ' : format === 'h2' ? '## ' : '### '
  const newLine: string = prefix + stripped
  const newValue: string = value.slice(0, lineStart) + newLine + value.slice(lineEnd)
  const start: number = lineStart + prefix.length
  const end: number = start + stripped.length
  return { value: newValue, selectionStart: start, selectionEnd: end }
}
