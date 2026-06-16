/**
 * Storage key used for preset labels assigned to notes created in the inbox.
 */
export const INBOX_LIST_KEY: string = '__inbox__'

/**
 * Returns the preset-label map key for a list id, or the inbox sentinel.
 *
 * @param listId Target list id, or `null` for the inbox.
 */
export function listLabelsKey(listId: string | null): string {
  return listId ?? INBOX_LIST_KEY
}
