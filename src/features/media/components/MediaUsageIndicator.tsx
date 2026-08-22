import { useId, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Dialog, DialogFooter, DialogHeader } from '../../../components/ui/Dialog'
import { mediaUsageDetail, mediaUsageKey, type MediaAssetUsage } from '../types'

export function MediaUsageIndicator({ usage }: { usage: MediaAssetUsage }) {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  if (!usage.isInUse) return null

  const sections = usage.website.sections
  const summary = `${sections[0]?.displayName ?? 'Website'}${sections.length > 1 ? ` +${sections.length - 1}` : ''}`
  return <>
    <Button className="mt-2 min-h-7! px-2! py-1! text-xs!" size="sm" variant="secondary" onClick={() => setOpen(true)}>
      <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">In use</span>
      <span>{summary}</span>
    </Button>
    <Dialog open={open} onClose={() => setOpen(false)} titleId={titleId} size="sm">
      <DialogHeader title="Used by Website" titleId={titleId} onClose={() => setOpen(false)} />
      <ul className="mt-4 space-y-2 text-sm">
        {sections.map((section) => {
          const detail = mediaUsageDetail(section)
          return <li className="rounded-md bg-surface-muted px-3 py-2" key={mediaUsageKey(section)}><span>{section.displayName}</span>{detail && <span className="mt-0.5 block text-xs text-foreground-muted">{detail}</span>}</li>
        })}
      </ul>
      <DialogFooter className="mt-5"><Button variant="secondary" onClick={() => setOpen(false)}>Close</Button></DialogFooter>
    </Dialog>
  </>
}
