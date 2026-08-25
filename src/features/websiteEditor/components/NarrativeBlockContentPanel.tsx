import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { useEventWorkspace } from '../../events/workspace/EventWorkspaceContext'
import type { StoryBlock, StoryContent, WebsiteDraft } from '../types'
import { BuilderSaveBar } from './BuilderSaveBar'
import { FocalPointEditor } from './FocalPointEditor'
import { MediaPickerDialog } from './MediaPickerDialog'

const slotLabels = {
  eyebrow: 'Eyebrow', heading: 'Heading', divider: 'Divider', body: 'Body', quote: 'Quote',
  media: 'Media', caption: 'Caption', cta: 'CTA',
} as const

type SlotKey = keyof typeof slotLabels

export function NarrativeBlockContentPanel({ block, content, dirty, resetDirty, resolvedMedia, onMediaResolved, onChange, onSave, onSaved, onReset }: {
  block: StoryBlock
  content: StoryContent
  dirty: boolean
  resetDirty: boolean
  resolvedMedia: WebsiteDraft['media']
  onMediaResolved: (media: WebsiteDraft['media'][string]) => void
  onChange: (content: StoryContent) => void
  onSave: (content: Record<string, unknown>) => Promise<WebsiteDraft>
  onSaved: (draft: WebsiteDraft) => void
  onReset: () => void
}) {
  const event = useEventWorkspace()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const index = content.elements.findIndex(({ id }) => id === block.id)
  if (index < 0) return null

  const update = (nextBlock: StoryBlock) => onChange({ ...content, elements: content.elements.map((item) => item.id === block.id ? nextBlock : item) })
  const updateSlot = <K extends SlotKey>(key: K, slot: StoryBlock['slots'][K]) => update({ ...block, slots: { ...block.slots, [key]: slot } })
  const visibility = (key: SlotKey) => {
    const slot = block.slots[key]
    return <Button type="button" size="sm" variant="secondary" onClick={() => updateSlot(key, { ...slot, isHidden: !slot.isHidden })}>{slot.isHidden ? `Show ${slotLabels[key]}` : `Hide ${slotLabels[key]}`}</Button>
  }
  const textField = (key: 'eyebrow' | 'heading' | 'body' | 'caption', multiline = false) => {
    const slot = block.slots[key]
    const Control = multiline ? Textarea : Input
    return <Slot label={slotLabels[key]} action={visibility(key)}><Control aria-label={slotLabels[key]} value={slot.text} onChange={(event) => updateSlot(key, { ...slot, text: event.target.value })} /></Slot>
  }
  const image = block.slots.media.content?.type === 'image' ? block.slots.media.content : null
  const asset = image ? resolvedMedia[image.mediaId] : undefined
  const framing = content.mediaFraming[block.id]

  return <div className="flex h-full min-h-0 flex-col">
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-6">
      <section className="rounded-md border border-border bg-surface-muted p-3">
        <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">Whole block</span><Button type="button" size="sm" variant={block.isHidden ? 'primary' : 'secondary'} onClick={() => update({ ...block, isHidden: !block.isHidden })}>{block.isHidden ? 'Show block' : 'Hide block'}</Button></div>
        {block.isHidden && <p className="mt-2 text-xs text-foreground-muted">Content is preserved and omitted from Preview/Public.</p>}
      </section>
      {textField('eyebrow')}
      {textField('heading')}
      <Slot label="Divider" action={visibility('divider')} />
      {textField('body', true)}
      <Slot label="Quote" action={visibility('quote')}>
        <Textarea aria-label="Quote" value={block.slots.quote.text} onChange={(event) => updateSlot('quote', { ...block.slots.quote, text: event.target.value })} />
        <Input aria-label="Quote attribution" placeholder="Attribution (optional)" value={block.slots.quote.attribution ?? ''} onChange={(event) => updateSlot('quote', { ...block.slots.quote, attribution: event.target.value || undefined })} />
      </Slot>
      <Slot label="Media" action={visibility('media')}>
        {asset && image ? <><FocalPointEditor url={asset.web.url} point={framing?.focalPoint ?? { x: 0.5, y: 0.5 }} zoom={framing?.zoom} onChange={({ point: focalPoint, zoom }) => onChange({ ...content, mediaFraming: { ...content.mediaFraming, [block.id]: { focalPoint, zoom } } })} /><p className="truncate text-xs text-foreground-muted">{asset.originalFilename}</p></> : <p className="text-xs text-foreground-muted">{block.slots.media.content ? 'This media type is preserved but not editable yet.' : 'No image selected.'}</p>}
        <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>{image ? 'Change image' : 'Choose image'}</Button>{image && <Button type="button" size="sm" variant="ghost" onClick={() => { const nextFraming = { ...content.mediaFraming }; delete nextFraming[block.id]; onChange({ ...content, elements: content.elements.map((item) => item.id === block.id ? { ...block, slots: { ...block.slots, media: { isHidden: true, content: null } } } : item), mediaFraming: nextFraming }) }}>Remove image</Button>}</div>
      </Slot>
      {textField('caption')}
      <Slot label="CTA" action={visibility('cta')}><Input aria-label="CTA label" value={block.slots.cta.label} onChange={(event) => updateSlot('cta', { ...block.slots.cta, label: event.target.value })} /><p className="text-xs text-foreground-muted">The existing semantic action is preserved.</p></Slot>
    </div>
    <BuilderSaveBar dirty={dirty} statusDirty={resetDirty} resetDirty={resetDirty} saving={saving} onSave={() => { setSaving(true); void onSave(content).then(onSaved).finally(() => setSaving(false)) }} onReset={onReset} />
    <MediaPickerDialog open={pickerOpen} eventId={event.id} selectedAssetId={image?.mediaId} onClose={() => setPickerOpen(false)} onSelect={(selected) => { onMediaResolved({ id: selected.id, originalFilename: selected.originalFilename, width: selected.width, height: selected.height, web: selected.variants.web }); updateSlot('media', { isHidden: false, content: { type: 'image', mediaId: selected.id } }); setPickerOpen(false) }} />
  </div>
}

function Slot({ label, action, children }: { label: string; action: React.ReactNode; children?: React.ReactNode }) {
  return <section className="space-y-2 rounded-md border border-border p-3"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">{label}</h3>{action}</div>{children}</section>
}
