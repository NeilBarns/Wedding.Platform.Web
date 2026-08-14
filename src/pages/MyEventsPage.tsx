import { CalendarHeart, Plus, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { CreateEventDialog } from '../features/events/CreateEventDialog'
import { EventCard } from '../features/events/EventCard'
import { useMyEvents } from '../features/events/useMyEvents'

function LoadingGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading events">
      {[0, 1, 2].map((item) => (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface" key={item}>
          <div className="aspect-[16/10] animate-pulse bg-surface-muted" />
          <div className="space-y-2.5 p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-surface-muted" />
            <div className="h-6 w-2/3 animate-pulse rounded bg-surface-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MyEventsPage() {
  const { events, isLoading, error, reload, prependEvent } = useMyEvents()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <main className="mx-auto max-w-[1360px] px-4 py-7 sm:px-5 sm:py-9 lg:px-6">
      <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Your collection</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">My Events</h1>
          <p className="mt-1 text-sm text-foreground-muted">Events you own or collaborate on.</p>
        </div>
        <button className="inline-flex min-h-10 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover" type="button" onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" size={17} /> Create Event
        </button>
      </div>

      {isLoading && <LoadingGrid />}

      {!isLoading && error && (
        <section className="rounded-2xl border border-border bg-surface p-6 text-center">
          <h2 className="text-lg font-semibold">We couldn’t load your events</h2>
          <p className="mt-1.5 text-sm text-foreground-muted">{error}</p>
          <button className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-[10px] border border-border px-3.5 py-2 text-sm hover:bg-surface-muted" type="button" onClick={reload}>
            <RefreshCw aria-hidden="true" size={17} /> Try again
          </button>
        </section>
      )}

      {!isLoading && !error && events.length === 0 && (
        <section className="rounded-2xl border border-dashed border-border bg-surface px-5 py-9 text-center sm:py-10">
          <span className="mx-auto grid size-11 place-items-center rounded-xl bg-surface-muted text-secondary-accent">
            <CalendarHeart aria-hidden="true" size={22} />
          </span>
          <h2 className="mt-3.5 text-lg font-semibold">You don’t have any events yet</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-foreground-muted">Create your first event and start building its website.</p>
          <button className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover" type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus aria-hidden="true" size={17} /> Create Event
          </button>
        </section>
      )}

      {!isLoading && !error && events.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => <EventCard event={event} key={event.id} />)}
        </div>
      )}

      <CreateEventDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={prependEvent} />
    </main>
  )
}
