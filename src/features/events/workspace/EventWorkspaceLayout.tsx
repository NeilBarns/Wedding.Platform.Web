import { useState } from 'react'
import { Outlet, useMatch, useParams } from 'react-router-dom'
import { EventWorkspaceContext } from './EventWorkspaceContext'
import { EventWorkspaceError, EventWorkspaceLoading } from './EventWorkspaceState'
import { EventWorkspaceMobileNav } from './EventWorkspaceMobileNav'
import { EventWorkspaceSidebar } from './EventWorkspaceSidebar'
import { useEventDetail } from './useEventDetail'

export function EventWorkspaceLayout() {
  const { eventId = '' } = useParams()
  const { event, error, isLoading, retry } = useEventDetail(eventId)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const focusedBuilder = useMatch('/events/:eventId/website') !== null

  if (isLoading) return <EventWorkspaceLoading focused={focusedBuilder} />
  if (error) return <EventWorkspaceError error={error} retry={retry} />
  if (!event) return null

  return (
    <EventWorkspaceContext value={event}>
      <div className="flex h-full min-h-0 overflow-hidden">
        {!focusedBuilder && <EventWorkspaceSidebar event={event} />}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {!focusedBuilder && <EventWorkspaceMobileNav
            event={event}
            open={mobileNavOpen}
            onOpen={() => setMobileNavOpen(true)}
            onClose={() => setMobileNavOpen(false)}
          />}
          <main className={`min-h-0 flex-1 ${focusedBuilder ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </EventWorkspaceContext>
  )
}
