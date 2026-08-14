import { useCallback, useEffect, useState } from 'react'
import { getWebsiteDraft } from './api'
import type { WebsiteDraft } from './types'

export function useWebsiteDraft(eventId: string) {
  const [result, setResult] = useState<{ eventId: string; draft: WebsiteDraft | null; error: unknown } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getWebsiteDraft(eventId, controller.signal)
      .then((draft) => setResult({ eventId, draft, error: null }))
      .catch((loadError: unknown) => {
        if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) {
          setResult({ eventId, draft: null, error: loadError })
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
  const setDraft = useCallback((draft: WebsiteDraft) => setResult({ eventId, draft, error: null }), [eventId])
  return {
    draft: isCurrent ? result.draft : null,
    setDraft,
    error: isCurrent ? result.error : null,
    isLoading: isLoading || !isCurrent,
    retry,
  }
}
