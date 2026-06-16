import type { NoteCipher, NoteVersionFields } from './types'

function ciphersEqual(left: NoteCipher | null, right: NoteCipher | null): boolean {
  if (left === null && right === null) return true
  if (left === null || right === null) return false
  return (
    left.iv === right.iv &&
    left.salt === right.salt &&
    left.iterations === right.iterations
  )
}

function labelsEqual(
  left: ReadonlyArray<string>,
  right: ReadonlyArray<string>,
): boolean {
  if (left.length !== right.length) return false
  return left.every((label: string, index: number): boolean => label === right[index])
}

/**
 * Returns whether two version snapshots contain the same editable note fields.
 *
 * @param left First snapshot to compare.
 * @param right Second snapshot to compare.
 */
export function noteVersionFieldsEqual(
  left: NoteVersionFields,
  right: NoteVersionFields,
): boolean {
  return (
    left.title === right.title &&
    left.content === right.content &&
    left.color === right.color &&
    left.dueAt === right.dueAt &&
    left.encrypted === right.encrypted &&
    labelsEqual(left.labels, right.labels) &&
    ciphersEqual(left.cipher, right.cipher)
  )
}
