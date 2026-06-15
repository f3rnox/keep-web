import type { MarkdownFormatResult } from './applyMarkdownFormat'

const CHECKLIST_LINE: RegExp = /^(\s*[-*]\s+\[[ x]\]\s*)(.*)$/i

/**
 * Inserts a new unchecked checklist item when Enter is pressed on a checklist line.
 * Removes the current line when Enter is pressed on an empty checklist item.
 *
 * @param value Current textarea value.
 * @param selectionStart Active selection start.
 * @param selectionEnd Active selection end.
 */
export function handleChecklistEnter(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): MarkdownFormatResult | null {
  if (selectionStart !== selectionEnd) return null

  const lineStart: number = value.lastIndexOf('\n', selectionStart - 1) + 1
  const lineEndIdx: number = value.indexOf('\n', selectionStart)
  const lineEnd: number = lineEndIdx === -1 ? value.length : lineEndIdx
  const line: string = value.slice(lineStart, lineEnd)
  const match: RegExpMatchArray | null = line.match(CHECKLIST_LINE)
  if (match === null) return null

  const itemText: string = match[2] ?? ''
  if (itemText.trim().length === 0) {
    let removeStart: number = lineStart
    let removeEnd: number = lineEnd
    if (removeEnd < value.length) {
      removeEnd += 1
    } else if (removeStart > 0) {
      removeStart -= 1
    }

    const nextValue: string = value.slice(0, removeStart) + value.slice(removeEnd)
    const cursor: number = Math.min(removeStart, nextValue.length)
    return { value: nextValue, selectionStart: cursor, selectionEnd: cursor }
  }

  const indent: string = line.match(/^(\s*)/)?.[1] ?? ''
  const insert: string = `\n${indent}- [ ] `
  const insertPos: number = lineEnd
  const nextValue: string = value.slice(0, insertPos) + insert + value.slice(insertPos)
  const cursor: number = insertPos + insert.length
  return { value: nextValue, selectionStart: cursor, selectionEnd: cursor }
}
