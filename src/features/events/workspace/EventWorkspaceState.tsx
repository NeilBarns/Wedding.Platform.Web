import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { EventLoadError } from './useEventDetail'

export function EventWorkspaceLoading() {
  return (
    <div className="flex h-full" aria-label="Loading Event workspace">
      <div className="hidden w-60 shrink-0 animate-pulse border-r border-border bg-surface lg:block" />
      <div className="flex-1 p-6 sm:p-8">
        <div className="h-7 w-40 animate-pulse rounded bg-surface-muted" />
        <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-surface-muted" />
      </div>
    </div>
  )
}

export function EventWorkspaceError({ error, retry }: { error: EventLoadError; retry: () => void }) {
  const title = error === 'forbidden' ? 'You don’t have access to this Event.'
    : error === 'notFound' ? 'Event not found.' : 'We couldn’t load this Event.'

  return (
    <main className="grid h-full place-items-center p-6">
      <section className="max-w-md rounded-2xl border border-border bg-surface p-6 text-center">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          {error === 'failed' ? 'Check your connection and try again.' : 'Return to My Events to choose another workspace.'}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm hover:bg-surface-muted" to="/events">
            <ArrowLeft aria-hidden="true" size={16} /> My Events
          </Link>
          {error === 'failed' && (
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover" type="button" onClick={retry}>
              <RefreshCw aria-hidden="true" size={16} /> Try again
            </button>
          )}
        </div>
      </section>
    </main>
  )
}
