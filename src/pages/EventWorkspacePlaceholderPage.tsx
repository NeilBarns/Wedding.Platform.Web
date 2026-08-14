import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

export function EventWorkspacePlaceholderPage() {
  const { eventId } = useParams()

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Link className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground" to="/events">
        <ArrowLeft aria-hidden="true" size={17} /> Back to My Events
      </Link>
      <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Event {eventId?.slice(0, 8)}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Event Workspace</h1>
      <p className="mt-3 text-foreground-muted">Coming in F4.</p>
    </main>
  )
}
