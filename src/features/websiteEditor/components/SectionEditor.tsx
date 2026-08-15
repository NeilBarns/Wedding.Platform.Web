import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ApiError } from '../../../lib/api'
import { validateSectionContent } from '../schemas'
import type { WebsiteDraft, WebsiteSection } from '../types'

type EditorProps = {
  section: WebsiteSection
  content: Record<string, unknown>
  dirty: boolean
  onChange: (content: Record<string, unknown>) => void
  onSave: (content: Record<string, unknown>) => Promise<WebsiteDraft>
  onSaved: (draft: WebsiteDraft) => void
}
type Field = { name: string; label: string; multiline?: boolean; note?: string }

function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.validationErrors.content?.[0] ?? error.message
  return 'Unable to save this section. Please try again.'
}

function useSectionSave(props: EditorProps) {
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  async function save() {
    const parsed = validateSectionContent(props.section.type, props.content)
    if (!parsed.success) { setError('Review this section and enter valid content before saving.'); return }
    setSaving(true); setError(null)
    try { props.onSaved(await props.onSave(parsed.data as Record<string, unknown>)) }
    catch (saveError) { setError(errorText(saveError)) }
    finally { setSaving(false) }
  }
  return { error, saving, save }
}

function SimpleEditor(props: EditorProps & { fields: Field[] }) {
  const { error, saving, save } = useSectionSave(props)
  return <EditorForm error={error} dirty={props.dirty} saving={saving} onSave={save}>
    {props.fields.map((field) => <TextField key={field.name} label={field.label} id={`${props.section.id}-${field.name}`} multiline={field.multiline} note={field.note} value={String(props.content[field.name] ?? '')} onChange={(value) => props.onChange({ ...props.content, [field.name]: value })} />)}
  </EditorForm>
}

function ScheduleEditor(props: EditorProps) {
  const { error, saving, save } = useSectionSave(props)
  const items = Array.isArray(props.content.items) ? props.content.items as Array<Record<string, string>> : []
  function updateItem(index: number, field: string, value: string) { props.onChange({ ...props.content, items: items.map((item, current) => current === index ? { ...item, [field]: value } : item) }) }
  function swap(index: number, target: number) { const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; props.onChange({ ...props.content, items: next }) }
  return <EditorForm error={error} dirty={props.dirty} saving={saving} onSave={save}>
    <TextField label="Heading" id={`${props.section.id}-heading`} value={String(props.content.heading ?? '')} onChange={(heading) => props.onChange({ ...props.content, heading })} />
    <ItemList title="Schedule items" onAdd={() => props.onChange({ ...props.content, items: [...items, { time: '', title: '', description: '' }] })}>
      {items.map((item, index) => <div className="rounded-xl border border-border bg-background p-3" key={index}>
        <div className="grid gap-3 sm:grid-cols-2"><TextField label="Time" id={`${props.section.id}-${index}-time`} value={item.time} onChange={(value) => updateItem(index, 'time', value)} /><TextField label="Title" id={`${props.section.id}-${index}-title`} value={item.title} onChange={(value) => updateItem(index, 'title', value)} /></div>
        <div className="mt-3"><TextField label="Description" id={`${props.section.id}-${index}-description`} value={item.description} multiline onChange={(value) => updateItem(index, 'description', value)} /></div>
        <ItemActions label="schedule item" index={index} length={items.length} onRemove={() => props.onChange({ ...props.content, items: items.filter((_, current) => current !== index) })} onMove={(to) => swap(index, to)} />
      </div>)}
    </ItemList>
  </EditorForm>
}

function FaqEditor(props: EditorProps) {
  const { error, saving, save } = useSectionSave(props)
  const items = Array.isArray(props.content.items) ? props.content.items as Array<Record<string, string>> : []
  function updateItem(index: number, field: string, value: string) { props.onChange({ ...props.content, items: items.map((item, current) => current === index ? { ...item, [field]: value } : item) }) }
  function swap(index: number, target: number) { const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; props.onChange({ ...props.content, items: next }) }
  return <EditorForm error={error} dirty={props.dirty} saving={saving} onSave={save}>
    <TextField label="Heading" id={`${props.section.id}-heading`} value={String(props.content.heading ?? '')} onChange={(heading) => props.onChange({ ...props.content, heading })} />
    <ItemList title="Questions" onAdd={() => props.onChange({ ...props.content, items: [...items, { question: '', answer: '' }] })}>
      {items.map((item, index) => <div className="rounded-xl border border-border bg-background p-3" key={index}>
        <TextField label="Question" id={`${props.section.id}-${index}-question`} value={item.question} onChange={(value) => updateItem(index, 'question', value)} />
        <div className="mt-3"><TextField label="Answer" id={`${props.section.id}-${index}-answer`} value={item.answer} multiline onChange={(value) => updateItem(index, 'answer', value)} /></div>
        <ItemActions label="FAQ item" index={index} length={items.length} onRemove={() => props.onChange({ ...props.content, items: items.filter((_, current) => current !== index) })} onMove={(to) => swap(index, to)} />
      </div>)}
    </ItemList>
  </EditorForm>
}

function EditorForm({ error, dirty, saving, onSave, children }: { error: string | null; dirty: boolean; saving: boolean; onSave: () => void; children: React.ReactNode }) {
  return <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void onSave() }} noValidate>
    {error && <p className="rounded-xl bg-danger-muted p-3 text-sm text-danger" role="alert">{error}</p>}
    {children}
    <div className="flex items-center justify-between border-t border-border pt-4"><span className="text-xs text-foreground-muted">{dirty ? 'Unsaved changes' : 'All changes saved'}</span><button className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50" disabled={!dirty || saving} type="submit">{saving ? 'Savingâ€¦' : 'Save changes'}</button></div>
  </form>
}

function TextField({ label, id, value, onChange, multiline = false, note }: { label: string; id: string; value: string; onChange: (value: string) => void; multiline?: boolean; note?: string }) {
  return <div><label className="block text-sm font-medium" htmlFor={id}>{label}</label>{multiline ? <textarea id={id} className="mt-1 min-h-20 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)} /> : <input id={id} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)} />}{note && <p className="mt-1.5 text-xs text-foreground-muted">{note}</p>}</div>
}

function ItemList({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) { return <div><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold">{title}</h3><button className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-surface-muted" type="button" onClick={onAdd}><Plus size={14} /> Add item</button></div><div className="space-y-3">{children}</div></div> }
function ItemActions({ label, index, length, onRemove, onMove }: { label: string; index: number; length: number; onRemove: () => void; onMove: (to: number) => void }) { return <div className="mt-2 flex justify-end gap-1"><button type="button" className="p-2 disabled:opacity-30" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Move ${label} up`}><ArrowUp size={15} /></button><button type="button" className="p-2 disabled:opacity-30" disabled={index === length - 1} onClick={() => onMove(index + 1)} aria-label={`Move ${label} down`}><ArrowDown size={15} /></button><button type="button" className="p-2 text-danger" onClick={onRemove} aria-label={`Remove ${label}`}><Trash2 size={15} /></button></div> }

export function SectionEditor(props: EditorProps) {
  switch (props.section.type) {
    case 'hero': return <SimpleEditor {...props} fields={[{ name: 'headline', label: 'Headline' }, { name: 'subheadline', label: 'Subheadline' }]} />
    case 'date': return <SimpleEditor {...props} fields={[{ name: 'heading', label: 'Heading' }, { name: 'description', label: 'Description', multiline: true, note: 'The event date is managed in Event settings.' }]} />
    case 'story': return <SimpleEditor {...props} fields={[{ name: 'heading', label: 'Heading' }, { name: 'body', label: 'Body', multiline: true }]} />
    case 'schedule': return <ScheduleEditor {...props} />
    case 'venue': return <SimpleEditor {...props} fields={[{ name: 'heading', label: 'Heading' }, { name: 'name', label: 'Venue name' }, { name: 'address', label: 'Address', multiline: true }, { name: 'description', label: 'Description', multiline: true }]} />
    case 'dressCode': return <SimpleEditor {...props} fields={[{ name: 'heading', label: 'Heading' }, { name: 'description', label: 'Description', multiline: true }]} />
    case 'gallery': return <SimpleEditor {...props} fields={[{ name: 'heading', label: 'Heading', note: 'Photo management will be added in a later phase.' }]} />
    case 'faq': return <FaqEditor {...props} />
    case 'rsvp': return <SimpleEditor {...props} fields={[{ name: 'heading', label: 'Heading' }, { name: 'description', label: 'Description', multiline: true }, { name: 'buttonLabel', label: 'Button label', note: 'This controls Website presentation only. Guest RSVP configuration is managed separately.' }]} />
    default: return <div className="rounded-xl bg-surface-muted p-4 text-sm text-foreground-muted">This section type is not supported by this version of the editor.</div>
  }
}
