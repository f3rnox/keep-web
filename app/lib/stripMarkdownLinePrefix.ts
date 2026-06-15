/**
 * Removes heading, bullet, and checklist prefixes from a single markdown line.
 *
 * @param line One line of markdown text.
 */
export function stripMarkdownLinePrefix(line: string): string {
  return line
    .replace(/^#{1,3}\s+/, '')
    .replace(/^\s*[-*]\s+\[[ x]\]\s*/i, '')
    .replace(/^\s*[-*]\s+/, '')
}
