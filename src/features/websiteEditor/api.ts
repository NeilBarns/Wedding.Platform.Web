import { apiRequest, ensureCsrfCookie } from '../../lib/api'
import type { ApiResource } from '../../lib/api'
import { parseWebsiteDraft } from './schemas'
import type { WebsiteDesignSettings, WebsiteDraft } from './types'

async function mutation(eventId: string, path: string, body: unknown): Promise<WebsiteDraft> {
  await ensureCsrfCookie()
  const response = await apiRequest<ApiResource<unknown>>(`/api/events/${encodeURIComponent(eventId)}/website${path}`, {
    method: 'PUT', body,
  })
  return parseWebsiteDraft(response.data)
}

export async function getWebsiteDraft(eventId: string, signal?: AbortSignal): Promise<WebsiteDraft> {
  const response = await apiRequest<ApiResource<unknown>>(`/api/events/${encodeURIComponent(eventId)}/website`, { signal })
  return parseWebsiteDraft(response.data)
}

export function updateWebsiteTemplate(eventId: string, templateKey: string) {
  return mutation(eventId, '/template', { templateKey })
}

export function updateWebsiteDesignSettings(eventId: string, designSettings: WebsiteDesignSettings) {
  return mutation(eventId, '/design', { designSettings })
}

export function updateWebsiteSectionContent(eventId: string, sectionId: string, content: Record<string, unknown>) {
  return mutation(eventId, `/sections/${encodeURIComponent(sectionId)}`, { content })
}

export function setWebsiteSectionEnabled(eventId: string, sectionId: string, isEnabled: boolean) {
  return mutation(eventId, `/sections/${encodeURIComponent(sectionId)}/enabled`, { isEnabled })
}

export function reorderWebsiteSections(eventId: string, sectionIds: string[]) {
  return mutation(eventId, '/sections/order', { sectionIds })
}
