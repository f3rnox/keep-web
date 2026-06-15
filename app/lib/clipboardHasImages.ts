/**
 * Returns whether a clipboard event carries at least one image item.
 *
 * @param event Clipboard event from a paste action.
 */
export function clipboardHasImages(event: ClipboardEvent): boolean {
  const items: DataTransferItemList | undefined = event.clipboardData?.items
  if (items === undefined) return false

  for (let i: number = 0; i < items.length; i += 1) {
    if (items[i].type.startsWith('image/')) return true
  }

  return false
}

/**
 * Returns whether a drag event carries at least one image file.
 *
 * @param event Drag event from a drop action.
 */
export function dragHasImages(event: DragEvent): boolean {
  const files: FileList | undefined = event.dataTransfer?.files
  if (files === undefined) return false

  for (let i: number = 0; i < files.length; i += 1) {
    if (files[i].type.startsWith('image/')) return true
  }

  return false
}
