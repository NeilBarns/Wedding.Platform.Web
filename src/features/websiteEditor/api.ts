import { apiRequest, ensureCsrfCookie } from '../../lib/api'
import type { ApiResource } from '../../lib/api'
import { normalizeWebsiteDraftFromApi } from './schemas'
import type { SectionDesignDefaults, WebsiteDesignSettings, WebsiteDraft, WebsiteSectionAppearance } from './types'

function projectPath(eventId: string, projectId: string): string {
  return `/api/events/${encodeURIComponent(eventId)}/websites/${encodeURIComponent(projectId)}`
}

async function mutation(eventId: string, projectId: string, path: string, body: unknown): Promise<WebsiteDraft> {
  await ensureCsrfCookie()
  const response = await apiRequest<ApiResource<unknown>>(`${projectPath(eventId, projectId)}${path}`, {
    method: 'PUT', body,
  })
  return normalizeWebsiteDraftFromApi(response.data)
}

export async function getWebsiteDraft(eventId: string, projectId: string, signal?: AbortSignal): Promise<WebsiteDraft> {
  const response = await apiRequest<ApiResource<unknown>>(projectPath(eventId, projectId), { signal })
  return normalizeWebsiteDraftFromApi(response.data)
}

export function updateWebsiteDesignSettings(eventId: string, projectId: string, designSettings: WebsiteDesignSettings) {
  return mutation(eventId, projectId, '/design', { designSettings })
}

export function updateWebsiteSectionContent(eventId: string, projectId: string, sectionId: string, content: Record<string, unknown>) {
  return mutation(eventId, projectId, `/sections/${encodeURIComponent(sectionId)}`, { content })
}

export function updateWebsiteSectionAppearance(eventId: string, projectId: string, sectionId: string, appearance: WebsiteSectionAppearance) {
  return mutation(eventId, projectId, `/sections/${encodeURIComponent(sectionId)}/appearance`, { appearance })
}

export function updateWebsiteSectionDesignDefaults(eventId: string, projectId: string, sectionId: string, designDefaults: SectionDesignDefaults) {
  return mutation(eventId, projectId, `/sections/${encodeURIComponent(sectionId)}/design-defaults`, { designDefaults })
}

export function setWebsiteSectionEnabled(eventId: string, projectId: string, sectionId: string, isEnabled: boolean) {
  return mutation(eventId, projectId, `/sections/${encodeURIComponent(sectionId)}/enabled`, { isEnabled })
}

export function reorderWebsiteSections(eventId: string, projectId: string, sectionIds: string[]) {
  return mutation(eventId, projectId, '/sections/order', { sectionIds })
}
