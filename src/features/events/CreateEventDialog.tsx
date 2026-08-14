import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ApiError } from '../../lib/api'
import { authErrorMessage } from '../auth/errorMessage'
import { createEvent } from './eventsApi'
import { createEventSchema, type CreateEventFormValues } from './schemas'
import type { Event } from './types'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (event: Event) => void
}

export function CreateEventDialog({ open, onClose, onCreated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { name: '', type: 'wedding', eventDate: '', slug: '' },
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function close() {
    if (isSubmitting) return
    setFormError(null)
    reset()
    onClose()
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const event = await createEvent({
        name: values.name,
        type: values.type,
        ...(values.eventDate ? { eventDate: values.eventDate } : {}),
        ...(values.slug ? { slug: values.slug } : {}),
      })
      reset()
      onCreated(event)
      onClose()
    } catch (error) {
      if (error instanceof ApiError) {
        for (const field of ['name', 'type', 'eventDate', 'slug'] as const) {
          const message = error.validationErrors[field]?.[0]
          if (message) setError(field, { message })
        }
      }
      setFormError(authErrorMessage(error))
    }
  })

  return (
    <dialog
      ref={dialogRef}
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-foreground shadow-[var(--shadow-dialog)] sm:w-full"
      aria-labelledby="create-event-title"
      onCancel={(event) => { if (isSubmitting) event.preventDefault(); else close() }}
      onClose={() => { if (open && !isSubmitting) close() }}
      onClick={(event) => { if (event.target === event.currentTarget) close() }}
    >
      <form className="space-y-4.5 p-5 sm:p-6" onSubmit={onSubmit} noValidate>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">New event</p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight" id="create-event-title">Create Event</h2>
            <p className="mt-1 text-sm text-foreground-muted">Add the essentials now. You can shape the experience later.</p>
          </div>
          <button className="rounded-lg p-2 text-foreground-muted hover:bg-surface-muted hover:text-foreground" type="button" onClick={close} aria-label="Close create event dialog">
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        {formError && <p className="rounded-xl bg-danger-muted p-3 text-sm text-danger" role="alert">{formError}</p>}

        <div>
          <label className="block text-sm font-medium" htmlFor="event-name">Event name</label>
          <input autoFocus className="mt-1 w-full rounded-[10px] border border-border bg-background px-3 py-2" id="event-name" {...register('name')} />
          {errors.name && <p className="mt-1.5 text-sm text-danger">{errors.name.message}</p>}
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="event-type">Event type</label>
            <select className="mt-1 w-full rounded-[10px] border border-border bg-background px-3 py-2" id="event-type" {...register('type')}>
              <option value="wedding">Wedding</option>
            </select>
            {errors.type && <p className="mt-1.5 text-sm text-danger">{errors.type.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="event-date">Event date <span className="text-foreground-muted">(optional)</span></label>
            <input className="mt-1 w-full rounded-[10px] border border-border bg-background px-3 py-2" id="event-date" type="date" {...register('eventDate')} />
            {errors.eventDate && <p className="mt-1.5 text-sm text-danger">{errors.eventDate.message}</p>}
          </div>
        </div>

        <details className="rounded-xl border border-border bg-surface-muted p-3.5">
          <summary className="cursor-pointer text-sm font-medium">Advanced options</summary>
          <div className="mt-3">
            <label className="block text-sm font-medium" htmlFor="event-slug">Custom URL slug <span className="text-foreground-muted">(optional)</span></label>
            <input className="mt-1 w-full rounded-[10px] border border-border bg-background px-3 py-2" id="event-slug" placeholder="neil-hazel" {...register('slug')} />
            <p className="mt-1.5 text-xs text-foreground-muted">Lowercase letters, numbers, and hyphens only.</p>
            {errors.slug && <p className="mt-1.5 text-sm text-danger">{errors.slug.message}</p>}
          </div>
        </details>

        <div className="flex flex-col-reverse gap-2.5 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button className="min-h-10 rounded-[10px] border border-border px-3.5 py-2 text-sm hover:bg-surface-muted disabled:opacity-60" type="button" disabled={isSubmitting} onClick={close}>Cancel</button>
          <button className="min-h-10 rounded-[10px] bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-60" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Event'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
