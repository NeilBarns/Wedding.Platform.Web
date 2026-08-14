import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '../../../lib/api'
import { faqContentSchema, scheduleContentSchema } from '../schemas'
import type { WebsiteDraft, WebsiteSection } from '../types'

type EditorProps = {
  section: WebsiteSection
  onSave: (content: Record<string, unknown>) => Promise<WebsiteDraft>
  onSaved: (draft: WebsiteDraft) => void
  onDirtyChange: (dirty: boolean) => void
  onPreviewContentChange: (content: Record<string, unknown> | null) => void
}

type Field = { name: string; label: string; multiline?: boolean; note?: string }
type SimpleValues = Record<string, string>
const simpleSchema = z.record(z.string(), z.string())
const emptyGalleryItems = { items: [] }

function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.validationErrors.content?.[0] ?? error.message
  return 'Unable to save this section. Please try again.'
}

function SimpleEditor({ section, fields, fixed = {}, onSave, onSaved, onDirtyChange, onPreviewContentChange }: EditorProps & {
  fields: Field[]
  fixed?: Record<string, unknown>
}) {
  const [error, setError] = useState<string | null>(null)
  const content = section.content as Record<string, unknown>
  const defaults = Object.fromEntries(fields.map(({ name }) => [name, String(content[name] ?? '')]))
  const { control, register, handleSubmit, reset, formState: { errors, isDirty, isSubmitting } } = useForm<SimpleValues>({
    resolver: zodResolver(simpleSchema), defaultValues: defaults,
  })
  const values = useWatch({ control })
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])
  useEffect(() => {
    const parsed = simpleSchema.safeParse(values)
    onPreviewContentChange(isDirty && parsed.success ? { ...parsed.data, ...fixed } : null)
  }, [fixed, isDirty, onPreviewContentChange, values])

  const submit = handleSubmit(async (values) => {
    setError(null)
    try {
      const draft = await onSave({ ...values, ...fixed })
      onSaved(draft)
      reset(values)
    } catch (saveError) { setError(errorText(saveError)) }
  })

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      {error && <p className="rounded-xl bg-danger-muted p-3 text-sm text-danger" role="alert">{error}</p>}
      {fields.map((field) => <div key={field.name}>
        <label className="block text-sm font-medium" htmlFor={`${section.id}-${field.name}`}>{field.label}</label>
        {field.multiline
          ? <textarea className="mt-1 min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" id={`${section.id}-${field.name}`} {...register(field.name)} />
          : <input className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" id={`${section.id}-${field.name}`} {...register(field.name)} />}
        {field.note && <p className="mt-1.5 text-xs text-foreground-muted">{field.note}</p>}
        {errors[field.name] && <p className="mt-1 text-xs text-danger">Enter a valid value.</p>}
      </div>)}
      <SaveButton disabled={!isDirty || isSubmitting} saving={isSubmitting} />
    </form>
  )
}

type ScheduleValues = z.infer<typeof scheduleContentSchema>
function ScheduleEditor(props: EditorProps) {
  const { section, onDirtyChange, onPreviewContentChange } = props
  const [error, setError] = useState<string | null>(null)
  const { control, register, handleSubmit, reset, formState: { isDirty, isSubmitting } } = useForm<ScheduleValues>({ resolver: zodResolver(scheduleContentSchema), defaultValues: section.content as ScheduleValues })
  const { fields, append, remove, swap } = useFieldArray({ control, name: 'items' })
  const values = useWatch({ control })
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])
  useEffect(() => {
    const parsed = scheduleContentSchema.safeParse(values)
    onPreviewContentChange(isDirty && parsed.success ? parsed.data : null)
  }, [isDirty, onPreviewContentChange, values])
  const submit = handleSubmit(async (values) => { try { setError(null); const draft = await props.onSave(values); props.onSaved(draft); reset(values) } catch (saveError) { setError(errorText(saveError)) } })
  return <form className="space-y-4" onSubmit={submit}>
    {error && <p className="rounded-xl bg-danger-muted p-3 text-sm text-danger">{error}</p>}
    <TextField label="Heading" id={`${props.section.id}-heading`} registration={register('heading')} />
    <ItemList title="Schedule items" onAdd={() => append({ time: '', title: '', description: '' })}>
      {fields.map((field, index) => <div className="rounded-xl border border-border bg-background p-3" key={field.id}>
        <div className="grid gap-3 sm:grid-cols-2"><TextField label="Time" id={`${field.id}-time`} registration={register(`items.${index}.time`)} /><TextField label="Title" id={`${field.id}-title`} registration={register(`items.${index}.title`)} /></div>
        <div className="mt-3"><TextField label="Description" id={`${field.id}-description`} registration={register(`items.${index}.description`)} multiline /></div>
        <ItemActions label="schedule item" index={index} length={fields.length} onRemove={() => remove(index)} onMove={(to) => swap(index, to)} />
      </div>)}
    </ItemList>
    <SaveButton disabled={!isDirty || isSubmitting} saving={isSubmitting} />
  </form>
}

type FaqValues = z.infer<typeof faqContentSchema>
function FaqEditor(props: EditorProps) {
  const { section, onDirtyChange, onPreviewContentChange } = props
  const [error, setError] = useState<string | null>(null)
  const { control, register, handleSubmit, reset, formState: { isDirty, isSubmitting } } = useForm<FaqValues>({ resolver: zodResolver(faqContentSchema), defaultValues: section.content as FaqValues })
  const { fields, append, remove, swap } = useFieldArray({ control, name: 'items' })
  const values = useWatch({ control })
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])
  useEffect(() => {
    const parsed = faqContentSchema.safeParse(values)
    onPreviewContentChange(isDirty && parsed.success ? parsed.data : null)
  }, [isDirty, onPreviewContentChange, values])
  const submit = handleSubmit(async (values) => { try { setError(null); const draft = await props.onSave(values); props.onSaved(draft); reset(values) } catch (saveError) { setError(errorText(saveError)) } })
  return <form className="space-y-4" onSubmit={submit}>
    {error && <p className="rounded-xl bg-danger-muted p-3 text-sm text-danger">{error}</p>}
    <TextField label="Heading" id={`${props.section.id}-heading`} registration={register('heading')} />
    <ItemList title="Questions" onAdd={() => append({ question: '', answer: '' })}>
      {fields.map((field, index) => <div className="rounded-xl border border-border bg-background p-3" key={field.id}>
        <TextField label="Question" id={`${field.id}-question`} registration={register(`items.${index}.question`)} />
        <div className="mt-3"><TextField label="Answer" id={`${field.id}-answer`} registration={register(`items.${index}.answer`)} multiline /></div>
        <ItemActions label="FAQ item" index={index} length={fields.length} onRemove={() => remove(index)} onMove={(to) => swap(index, to)} />
      </div>)}
    </ItemList>
    <SaveButton disabled={!isDirty || isSubmitting} saving={isSubmitting} />
  </form>
}

function SaveButton({ disabled, saving }: { disabled: boolean; saving: boolean }) {
  return <div className="flex justify-end border-t border-border pt-4"><button className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} type="submit">{saving ? 'Saving…' : 'Save changes'}</button></div>
}

function TextField({ label, id, registration, multiline = false }: { label: string; id: string; registration: ReturnType<ReturnType<typeof useForm>['register']>; multiline?: boolean }) {
  return <div><label className="block text-sm font-medium" htmlFor={id}>{label}</label>{multiline ? <textarea id={id} className="mt-1 min-h-20 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" {...registration} /> : <input id={id} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" {...registration} />}</div>
}

function ItemList({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return <div><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold">{title}</h3><button className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-surface-muted" type="button" onClick={onAdd}><Plus size={14} /> Add item</button></div><div className="space-y-3">{children}</div></div>
}

function ItemActions({ label, index, length, onRemove, onMove }: { label: string; index: number; length: number; onRemove: () => void; onMove: (to: number) => void }) {
  return <div className="mt-2 flex justify-end gap-1"><button type="button" className="p-2 disabled:opacity-30" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Move ${label} up`}><ArrowUp size={15} /></button><button type="button" className="p-2 disabled:opacity-30" disabled={index === length - 1} onClick={() => onMove(index + 1)} aria-label={`Move ${label} down`}><ArrowDown size={15} /></button><button type="button" className="p-2 text-danger" onClick={onRemove} aria-label={`Remove ${label}`}><Trash2 size={15} /></button></div>
}

export function SectionEditor(props: EditorProps) {
  const common = props
  switch (props.section.type) {
    case 'hero': return <SimpleEditor {...common} fields={[{ name: 'headline', label: 'Headline' }, { name: 'subheadline', label: 'Subheadline' }]} />
    case 'date': return <SimpleEditor {...common} fields={[{ name: 'heading', label: 'Heading' }, { name: 'description', label: 'Description', multiline: true, note: 'The event date is managed in Event settings.' }]} />
    case 'story': return <SimpleEditor {...common} fields={[{ name: 'heading', label: 'Heading' }, { name: 'body', label: 'Body', multiline: true }]} />
    case 'schedule': return <ScheduleEditor {...common} />
    case 'venue': return <SimpleEditor {...common} fields={[{ name: 'heading', label: 'Heading' }, { name: 'name', label: 'Venue name' }, { name: 'address', label: 'Address', multiline: true }, { name: 'description', label: 'Description', multiline: true }]} />
    case 'dressCode': return <SimpleEditor {...common} fields={[{ name: 'heading', label: 'Heading' }, { name: 'description', label: 'Description', multiline: true }]} />
    case 'gallery': return <SimpleEditor {...common} fields={[{ name: 'heading', label: 'Heading', note: 'Photo management will be added in a later phase.' }]} fixed={emptyGalleryItems} />
    case 'faq': return <FaqEditor {...common} />
    case 'rsvp': return <SimpleEditor {...common} fields={[{ name: 'heading', label: 'Heading' }, { name: 'description', label: 'Description', multiline: true }, { name: 'buttonLabel', label: 'Button label', note: 'This controls Website presentation only. Guest RSVP configuration is managed separately.' }]} />
    default: return <div className="rounded-xl bg-surface-muted p-4 text-sm text-foreground-muted">This section type is not supported by this version of the editor.</div>
  }
}
