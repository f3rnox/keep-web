/**
 * Chooses the list id applied to a newly created note or task.
 *
 * @param contextListId List id from the active list view, if any.
 * @param defaultListId Default list configured in General settings.
 * @param validListIds Known list ids used to ignore deleted lists.
 */
export function resolveNewNoteListId(
  contextListId: string | null,
  defaultListId: string | null,
  validListIds: ReadonlySet<string>,
): string | null {
  if (contextListId !== null) {
    return validListIds.has(contextListId) ? contextListId : null
  }

  if (defaultListId !== null && validListIds.has(defaultListId)) {
    return defaultListId
  }

  return null
}
