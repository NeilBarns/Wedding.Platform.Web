import { apiRequest, ensureCsrfCookie } from '../../lib/api'
import type { ApiCollection, ApiResource } from '../../lib/api'
import type { CreateEventRequest, Event } from './types'

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
