import { apiRequest, ensureCsrfCookie } from '../../lib/api'
import type { ApiCollection, ApiResource } from '../../lib/api'
import type { CreateEventRequest, Event, EventDetail } from './types'

export async function getMyEvents(signal?: AbortSignal): Promise<Event[]> {
  const response = await apiRequest<ApiCollection<Event>>('/api/events', { signal })
  return response.data
}

export async function createEvent(input: CreateEventRequest): Promise<Event> {
  await ensureCsrfCookie()
  const response = await apiRequest<ApiResource<Event>>('/api/events', {
    method: 'POST',
    body: input,
  })
  return response.data
}

export async function getEvent(eventId: string, signal?: AbortSignal): Promise<EventDetail> {
  const response = await apiRequest<ApiResource<EventDetail>>(`/api/events/${encodeURIComponent(eventId)}`, { signal })
  return response.data
}
