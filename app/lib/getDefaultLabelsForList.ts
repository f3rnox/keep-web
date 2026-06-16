import { listLabelsKey } from './inboxListKey'

/**
 * Returns preset labels configured for a target list or the inbox.
 *
 * @param listId Target list id, or `null` for the inbox.
 * @param labelsByListId Persisted preset label map from settings.
 */
export function getDefaultLabelsForList(
  listId: string | null,
  labelsByListId: Record<string, ReadonlyArray<string>>,
): ReadonlyArray<string> {
  return labelsByListId[listLabelsKey(listId)] ?? []
}
