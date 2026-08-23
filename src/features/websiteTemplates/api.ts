import { z } from 'zod'
import { apiRequest } from '../../lib/api'
import type { ApiResource } from '../../lib/api'
import type { WebsiteTemplateOption } from './types'

const nonEmptyString = z.string().refine((value) => value.trim().length > 0, 'Required')
const templateSchema = z.object({
  key: nonEmptyString,
  displayName: nonEmptyString,
  description: nonEmptyString,
  styleTags: z.array(nonEmptyString),
  isSelected: z.boolean(),
}).strict()

export async function getCompatibleWebsiteTemplates(eventId: string, signal?: AbortSignal, projectId?: string): Promise<WebsiteTemplateOption[]> {
  const suffix = projectId ? `/websites/${encodeURIComponent(projectId)}/templates` : '/website/templates'
  const response = await apiRequest<ApiResource<unknown>>(`/api/events/${encodeURIComponent(eventId)}${suffix}`, { signal })
  return z.array(templateSchema).parse(response.data)
}
