import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Heading } from '../../../components/ui/Heading'
import { Text } from '../../../components/ui/Text'
import { getWebsiteDraft, initializeWebsite } from '../../websiteEditor/api'
import { listWebsiteProjects } from '../../websiteProjects/api'
import type { WebsiteDraft } from '../../websiteEditor/types'
import { ApiError } from '../../../lib/api'
import { getCompatibleWebsiteTemplates } from '../api'
import type { WebsiteTemplateOption } from '../types'
import { TemplateCard } from './TemplateCard'

export function WebsiteTemplateOnboarding({ eventId, onInitialized }: { eventId: string; onInitialized: (draft: WebsiteDraft) => void }) {
  const [templates, setTemplates] = useState<WebsiteTemplateOption[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [initializingKey, setInitializingKey] = useState<string | null>(null)
  const [initializeError, setInitializeError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const loadTemplates = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    setReloadKey((value) => value + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getCompatibleWebsiteTemplates(eventId, controller.signal)
      .then((items) => { setTemplates(items); setLoadError(null) })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load Templates.')
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [eventId, reloadKey])

  async function choose(template: WebsiteTemplateOption) {
    setInitializingKey(template.key)
    setInitializeError(null)
    try {
      onInitialized(await initializeWebsite(eventId, template.key))
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        try {
          const projects = await listWebsiteProjects(eventId)
          if (!projects[0]) throw new Error('The Website Project could not be found.', { cause: error })
          onInitialized(await getWebsiteDraft(eventId, projects[0].id))
          return
        } catch (recoveryError) {
          setInitializeError(recoveryError instanceof Error ? recoveryError.message : 'The Website was created, but could not be loaded.')
        }
      } else {
        setInitializeError(error instanceof Error ? error.message : 'Unable to create the Website.')
      }
    } finally {
      setInitializingKey(null)
    }
  }

  return <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
    <div className="mx-auto max-w-2xl text-center">
      <Text className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Event Website</Text>
      <Heading className="mt-3" level={1} variant="page">Create your Event Website</Heading>
      <Heading className="mt-5" level={2} variant="section">Choose a starting Template</Heading>
      <Text className="mt-2" variant="muted">Pick the design that feels right for your event. You can change your Template anytime without losing your Website content.</Text>
    </div>

    <div className="mt-8" aria-live="polite">
      {loading && <Text className="text-center" variant="muted">Loading Templates…</Text>}
      {loadError && <div className="mx-auto max-w-lg rounded-xl border border-border bg-surface p-5 text-center"><Text variant="error" role="alert">{loadError}</Text><Button className="mt-4" size="sm" type="button" onClick={loadTemplates}>Try again</Button></div>}
      {initializeError && <Text className="mb-5 rounded-xl bg-danger-muted p-3 text-center" variant="error" role="alert">{initializeError}</Text>}
      {!loading && !loadError && <div className="grid gap-6 sm:grid-cols-2">{templates.map((template) => <TemplateCard key={template.key} template={template} presentation="gallery" actionLabel={`Choose ${template.displayName}`} disabled={initializingKey !== null} onSelect={() => void choose(template)} />)}</div>}
      {initializingKey && <Text className="mt-5 text-center" variant="muted" role="status">Creating your Website…</Text>}
    </div>
  </main>
}
