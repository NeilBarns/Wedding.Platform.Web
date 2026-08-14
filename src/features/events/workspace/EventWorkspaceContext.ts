import { createContext, use } from 'react'
import type { EventDetail } from '../types'

export const EventWorkspaceContext = createContext<EventDetail | null>(null)

export function useEventWorkspace(): EventDetail {
  const event = use(EventWorkspaceContext)
  if (!event) throw new Error('useEventWorkspace must be used within EventWorkspaceLayout.')
  return event
}
