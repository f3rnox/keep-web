'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState, type JSX } from 'react'
import { useAiSettings } from '../lib/useAiSettings'
import { suggestNoteTitle } from '../lib/suggestNoteTitle'
import { Icon } from './Icon'

/**
 * Props for the suggest-title control shown beside note title inputs.
 */
export interface SuggestTitleButtonProps {
  content: string
  onSuggested: (title: string) => void
  disabled?: boolean
}

/**
 * Button that asks the configured AI provider to suggest a note title from
 * the current body content.
 *
 * @param props.content Note body sent to the AI provider.
 * @param props.onSuggested Called with the generated title on success.
 * @param props.disabled When true, the button cannot be used.
 */
export function SuggestTitleButton({
  content,
  onSuggested,
  disabled = false,
}: SuggestTitleButtonProps): JSX.Element {
  const { settings } = useAiSettings()
  const [busy, setBusy] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const configured: boolean = useMemo((): boolean => {
    if (settings.provider === 'google') return settings.googleApiKey.trim().length > 0
    return settings.anthropicApiKey.trim().length > 0
  }, [settings])
  const hasContent: boolean = content.trim().length > 0
  const isDisabled: boolean = disabled || busy || !hasContent

  const handleClick = useCallback(async (): Promise<void> => {
    if (!configured) return
    setBusy(true)
    setError(null)

    try {
      const title: string = await suggestNoteTitle(content)
      onSuggested(title)
    } catch (suggestError: unknown) {
      const message: string =
        suggestError instanceof Error ? suggestError.message : 'Could not suggest a title'
      setError(message)
    } finally {
      setBusy(false)
    }
  }, [configured, content, onSuggested])

  if (!configured) {
    return (
      <Link
        href='/settings/ai'
        className='shrink-0 text-xs font-medium text-muted underline underline-offset-2 transition hover:text-foreground'
      >
        Set up AI
      </Link>
    )
  }

  return (
    <div className='flex shrink-0 flex-col items-end gap-0.5'>
      <button
        type='button'
        onClick={(): void => {
          void handleClick()
        }}
        disabled={isDisabled}
        title={hasContent ? 'Suggest title from note content' : 'Add note content first'}
        className='inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted'
      >
        <Icon name='lightbulb' size={14} />
        {busy ? 'Suggesting…' : 'Suggest title'}
      </button>
      {error ? <p className='max-w-40 text-right text-[11px] text-red-600 dark:text-red-400'>{error}</p> : null}
    </div>
  )
}
