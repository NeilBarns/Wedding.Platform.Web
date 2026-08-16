import { useCallback, useEffect, useState } from 'react'
import { getWebsiteDraft } from './api'
import type { WebsiteDraft } from './types'
import { ApiError } from '../../lib/api'

export function useWebsiteDraft(eventId: string) {
  const [result, setResult] = useState<{ eventId: string; draft: WebsiteDraft | null; error: unknown; uninitialized: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getWebsiteDraft(eventId, controller.signal)
      .then((draft) => setResult({ eventId, draft, error: null, uninitialized: false }))
      .catch((loadError: unknown) => {
        if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) {
          setResult({
            eventId,
            draft: null,
            error: loadError instanceof ApiError && loadError.status === 404 ? null : loadError,
            uninitialized: loadError instanceof ApiError && loadError.status === 404,
          })
        }
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    return () => controller.abort()
  }, [eventId, reloadKey])

  const retry = useCallback(() => {
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }, [])
  const isCurrent = result?.eventId === eventId
  const setDraft = useCallback((draft: WebsiteDraft) => setResult({ eventId, draft, error: null, uninitialized: false }), [eventId])
  return {
    draft: isCurrent ? result.draft : null,
    setDraft,
    error: isCurrent ? result.error : null,
    isLoading: isLoading || !isCurrent,
    isUninitialized: Boolean(isCurrent && result?.uninitialized),
    retry,
  }
}
