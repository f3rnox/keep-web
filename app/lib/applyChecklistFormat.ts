import { stripMarkdownLinePrefix } from './stripMarkdownLinePrefix'

const CHECKLIST_PREFIX: string = '- [ ] '

/**
 * Converts the current line or selected lines into GitHub-style checklist markdown.
 *
 * @param value Current textarea value.
 * @param selectionStart Active selection start.
 * @param selectionEnd Active selection end.
 */
export function applyChecklistFormat(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): {
  value: string
  selectionStart: number
  selectionEnd: number
} {
  const selected: string = value.slice(selectionStart, selectionEnd)
  const blockStart: number = value.lastIndexOf('\n', selectionStart - 1) + 1
  const blockEndIdx: number = value.indexOf('\n', selectionEnd)
  const blockEnd: number = blockEndIdx === -1 ? value.length : blockEndIdx

  if (selected.includes('\n')) {
    const block: string = value.slice(blockStart, blockEnd)
    const converted: string = block
      .split('\n')
      .map((line: string): string => {
        const stripped: string = stripMarkdownLinePrefix(line).trim()
        return stripped.length > 0 ? `${CHECKLIST_PREFIX}${stripped}` : CHECKLIST_PREFIX
      })
      .join('\n')
    const nextValue: string = value.slice(0, blockStart) + converted + value.slice(blockEnd)
    const cursor: number = blockStart + converted.length
    return { value: nextValue, selectionStart: cursor, selectionEnd: cursor }
  }

  const line: string = value.slice(blockStart, blockEnd)
  const placeholder: string = 'item'
  const label: string =
    selected.length > 0 ? selected : stripMarkdownLinePrefix(line).trim() || placeholder
  const newLine: string = `${CHECKLIST_PREFIX}${label}`
  const nextValue: string = value.slice(0, blockStart) + newLine + value.slice(blockEnd)
  const labelStart: number = blockStart + CHECKLIST_PREFIX.length
  const labelEnd: number = labelStart + label.length

  if (
    label === placeholder &&
    selected.length === 0 &&
    stripMarkdownLinePrefix(line).trim().length === 0
  ) {
    return { value: nextValue, selectionStart: labelStart, selectionEnd: labelEnd }
  }

  return { value: nextValue, selectionStart: labelEnd, selectionEnd: labelEnd }
}
