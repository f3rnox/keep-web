/**
 * Toggles a single checklist item at the given line index in markdown content.
 *
 * @param content Full note body.
 * @param lineIndex Zero-based line index of the checklist item.
 */
export function toggleChecklistLine(content: string, lineIndex: number): string {
  const lines: string[] = content.split('\n')
  if (lineIndex < 0 || lineIndex >= lines.length) return content

  const line: string = lines[lineIndex]
  const unchecked: RegExp = /^(\s*[-*]\s+)\[ \](\s*)(.*)$/
  const checked: RegExp = /^(\s*[-*]\s+)\[x\](\s*)(.*)$/i

  if (unchecked.test(line)) {
    lines[lineIndex] = line.replace(unchecked, '$1[x]$2$3')
  } else if (checked.test(line)) {
    lines[lineIndex] = line.replace(checked, '$1[ ]$2$3')
  } else {
    return content
  }

  return lines.join('\n')
}
