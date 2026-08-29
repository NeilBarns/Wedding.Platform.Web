import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { useEventWorkspace } from '../../events/workspace/EventWorkspaceContext'
import type { StoryBlock, StoryContent, WebsiteDraft } from '../types'
import { FocalPointEditor } from './FocalPointEditor'
import { InspectorDisclosure, InspectorSection } from './InspectorPrimitives'
import { MediaPickerDialog } from './MediaPickerDialog'
import type { NarrativeSlotKey } from '../narrativeSlotFocus'
import { SemanticTextContentField } from './SemanticTextContentField'

const slotLabels = { eyebrow: 'Eyebrow', heading: 'Heading', divider: 'Divider', body: 'Body', quote: 'Quote', media: 'Media', caption: 'Caption', cta: 'CTA' } as const
type SlotKey = keyof typeof slotLabels

export function NarrativeBlockContentPanel({ block, content, resolvedMedia, onMediaResolved, onChange, activeDisclosure, onDisclosureChange }: { block: StoryBlock; content: StoryContent; resolvedMedia: WebsiteDraft['media']; onMediaResolved: (media: WebsiteDraft['media'][string]) => void; onChange: (content: StoryContent) => void; activeDisclosure: NarrativeSlotKey | null; onDisclosureChange: (key: NarrativeSlotKey | null) => void }) {
  const event = useEventWorkspace()
  const [pickerOpen, setPickerOpen] = useState(false)
  const index = content.elements.findIndex(({ id }) => id === block.id)
  if (index < 0) return null
  const update = (nextBlock: StoryBlock) => onChange({ ...content, elements: content.elements.map((item) => item.id === block.id ? nextBlock : item) })
  const updateSlot = <K extends SlotKey>(key: K, slot: StoryBlock['slots'][K]) => update({ ...block, slots: { ...block.slots, [key]: slot } })
  const visibility = (key: SlotKey) => { const slot = block.slots[key]; const label = `${slot.isHidden ? 'Show' : 'Hide'} ${slotLabels[key]}`; const Icon = slot.isHidden ? EyeOff : Eye; return <Button type="button" size="sm" variant="ghost" className={`h-9 min-h-9 w-9 shrink-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${slot.isHidden ? 'bg-surface-muted text-foreground-muted' : 'text-foreground-muted'}`} aria-label={label} title={label} aria-pressed={slot.isHidden} onClick={() => updateSlot(key, { ...slot, isHidden: !slot.isHidden })}><Icon size={16} aria-hidden="true" /></Button> }
  const summary = (key: SlotKey) => {
    const slot = block.slots[key]
    if (slot.isHidden) return 'Hidden'
    if ('text' in slot) return preview(slot.text)
    if (key === 'quote') return preview(block.slots.quote.text)
    if (key === 'media') return block.slots.media.content ? (block.slots.media.content.type === 'image' ? resolvedMedia[block.slots.media.content.mediaId]?.originalFilename ?? 'Image' : block.slots.media.content.type) : 'No media'
    if (key === 'cta') return preview(block.slots.cta.label)
    return 'Visible'
  }
  const disclosure = (key: NarrativeSlotKey) => ({ open: activeDisclosure === key, onOpenChange: (open: boolean) => onDisclosureChange(open ? key : null) })
  const textDisclosure = (key: 'eyebrow' | 'heading' | 'body' | 'caption', multiline = false) => { const slot = block.slots[key]; return <InspectorDisclosure {...disclosure(key)} title={slotLabels[key]} summary={summary(key)} actions={visibility(key)}><SemanticTextContentField id={`narrative-${block.id}-${key}`} label={slotLabels[key]} hideLabel value={slot.text} multiline={multiline} onChange={(text) => updateSlot(key, { ...slot, text })} /></InspectorDisclosure> }
  const image = block.slots.media.content?.type === 'image' ? block.slots.media.content : null
  const asset = image ? resolvedMedia[image.mediaId] : undefined
  const framing = content.mediaFraming[block.id]
  return <div className="flex h-full min-h-0 flex-col"><div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-1 pb-6">
    <InspectorSection title="Text">
      {textDisclosure('eyebrow')}{textDisclosure('heading')}{textDisclosure('body', true)}
      <InspectorDisclosure {...disclosure('quote')} title="Quote" summary={summary('quote')} actions={visibility('quote')}><Textarea aria-label="Quote" value={block.slots.quote.text} onChange={(inputEvent) => updateSlot('quote', { ...block.slots.quote, text: inputEvent.target.value })} /><Input aria-label="Quote attribution" placeholder="Attribution (optional)" value={block.slots.quote.attribution ?? ''} onChange={(inputEvent) => updateSlot('quote', { ...block.slots.quote, attribution: inputEvent.target.value || undefined })} /></InspectorDisclosure>
      {textDisclosure('caption')}
      <InspectorDisclosure {...disclosure('divider')} title="Divider" summary={summary('divider')} actions={visibility('divider')}><p className="text-xs text-foreground-muted">Divider styling is owned by the template.</p></InspectorDisclosure>
    </InspectorSection>
    <InspectorSection title="Media"><InspectorDisclosure {...disclosure('media')} title="Media" summary={summary('media')} actions={visibility('media')}>
      {asset && image ? <><FocalPointEditor url={asset.web.url} point={framing?.focalPoint ?? { x: 0.5, y: 0.5 }} zoom={framing?.zoom} onChange={({ point: focalPoint, zoom }) => onChange({ ...content, mediaFraming: { ...content.mediaFraming, [block.id]: { focalPoint, zoom } } })} /><p className="truncate text-xs text-foreground-muted">{asset.originalFilename}</p></> : <p className="text-xs text-foreground-muted">{block.slots.media.content ? 'This media type is preserved but not editable yet.' : 'No image selected.'}</p>}
      <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>{image ? 'Change image' : 'Choose image'}</Button>{image && <Button type="button" size="sm" variant="ghost" onClick={() => { const nextFraming = { ...content.mediaFraming }; delete nextFraming[block.id]; onChange({ ...content, elements: content.elements.map((item) => item.id === block.id ? { ...block, slots: { ...block.slots, media: { isHidden: true, content: null } } } : item), mediaFraming: nextFraming }) }}>Remove image</Button>}</div>
    </InspectorDisclosure></InspectorSection>
    <InspectorSection title="Action"><InspectorDisclosure {...disclosure('cta')} title="CTA" summary={summary('cta')} actions={visibility('cta')}><Input aria-label="CTA label" value={block.slots.cta.label} onChange={(inputEvent) => updateSlot('cta', { ...block.slots.cta, label: inputEvent.target.value })} /><p className="text-xs text-foreground-muted">The existing semantic action is preserved.</p></InspectorDisclosure></InspectorSection>
  </div><MediaPickerDialog open={pickerOpen} eventId={event.id} selectedAssetId={image?.mediaId} onClose={() => setPickerOpen(false)} onSelect={(selected) => { onMediaResolved({ id: selected.id, originalFilename: selected.originalFilename, width: selected.width, height: selected.height, web: selected.variants.web }); updateSlot('media', { isHidden: false, content: { type: 'image', mediaId: selected.id } }); setPickerOpen(false) }} /></div>
}

function preview(value: string) { const compact = value.trim().replace(/\s+/g, ' '); return compact ? compact.slice(0, 72) : 'Empty' }
