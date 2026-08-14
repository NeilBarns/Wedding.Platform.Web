import { useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { EventWorkspaceContext } from './EventWorkspaceContext'
import { EventWorkspaceError, EventWorkspaceLoading } from './EventWorkspaceState'
import { EventWorkspaceMobileNav } from './EventWorkspaceMobileNav'
import { EventWorkspaceSidebar } from './EventWorkspaceSidebar'
import { useEventDetail } from './useEventDetail'

export function EventWorkspaceLayout() {
  const { eventId = '' } = useParams()
  const { event, error, isLoading, retry } = useEventDetail(eventId)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  if (isLoading) return <EventWorkspaceLoading />
  if (error) return <EventWorkspaceError error={error} retry={retry} />
  if (!event) return null

  return (
    <EventWorkspaceContext value={event}>
      <div className="flex h-full min-h-0 overflow-hidden">
        <EventWorkspaceSidebar event={event} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <EventWorkspaceMobileNav
            event={event}
            open={mobileNavOpen}
            onOpen={() => setMobileNavOpen(true)}
            onClose={() => setMobileNavOpen(false)}
          />
          <main className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </EventWorkspaceContext>
  )
}
