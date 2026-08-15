import { z } from 'zod'
import { apiRequest } from '../../lib/api'
import type { ApiResource } from '../../lib/api'
import type { WebsiteTemplateOption } from './types'

const templateSchema = z.object({
  key: z.string(),
  displayName: z.string(),
  description: z.string(),
  styleTags: z.array(z.string()),
  isSelected: z.boolean(),
}).strict()

export async function getCompatibleWebsiteTemplates(eventId: string, signal?: AbortSignal): Promise<WebsiteTemplateOption[]> {
  const response = await apiRequest<ApiResource<unknown>>(`/api/events/${encodeURIComponent(eventId)}/website/templates`, { signal })
  return z.array(templateSchema).parse(response.data)
}
