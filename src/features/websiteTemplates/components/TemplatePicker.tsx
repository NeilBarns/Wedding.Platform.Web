import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Dialog, DialogFooter, DialogHeader } from '../../../components/ui/Dialog'
import { Text } from '../../../components/ui/Text'
import { getCompatibleWebsiteTemplates } from '../api'
import type { WebsiteTemplateOption } from '../types'
import { TemplateCard } from './TemplateCard'

export function TemplatePicker({ open, eventId, projectId, currentTemplateKey, onClose, onChoose }: { open: boolean; eventId: string; projectId: string; currentTemplateKey: string; onClose: () => void; onChoose: (template: WebsiteTemplateOption) => void }) {
  const [templates, setTemplates] = useState<WebsiteTemplateOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    getCompatibleWebsiteTemplates(eventId, controller.signal, projectId)
      .then((loadedTemplates) => { setTemplates(loadedTemplates); setError(null) })
      .catch((loadError: unknown) => { if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) setError(loadError instanceof Error ? loadError.message : 'Unable to load Templates.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [eventId, projectId, open, currentTemplateKey])

  return <Dialog open={open} onClose={onClose} titleId="template-picker-title" descriptionId="template-picker-description">
    <div className="p-5 sm:p-6">
      <DialogHeader title="Choose a Template" titleId="template-picker-title" description="Choose a compatible presentation for your Website." descriptionId="template-picker-description" onClose={onClose} closeLabel="Close Template picker" />
      <div className="mt-5">
        {loading && <Text variant="muted">Loading Templates…</Text>}
        {error && <Text className="rounded-lg bg-danger-muted p-3" variant="error" role="alert">{error}</Text>}
        {!loading && !error && <div className="grid gap-4 sm:grid-cols-2">{templates.map((template) => <TemplateCard key={template.key} template={{ ...template, isSelected: template.key === currentTemplateKey }} onSelect={() => onChoose(template)} />)}</div>}
      </div>
      <DialogFooter className="mt-5 border-t border-border pt-4"><Button variant="secondary" size="sm" type="button" onClick={onClose}>Close</Button></DialogFooter>
    </div>
  </Dialog>
}
