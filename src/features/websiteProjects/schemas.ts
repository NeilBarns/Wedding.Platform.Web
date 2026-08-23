import { z } from 'zod'
import type { WebsiteProjectSummary } from './types'

const nonEmpty = z.string().refine((value) => value.trim().length > 0, 'Required')
const designSettingsSchema = z.object({
  colorTheme: nonEmpty,
  fontSet: nonEmpty,
  artStyle: nonEmpty,
}).strict()

export const websiteProjectSummarySchema = z.object({
  id: nonEmpty,
  eventId: nonEmpty,
  name: nonEmpty.max(100),
  templateKey: nonEmpty,
  designSettings: designSettingsSchema,
}).strict()

export function parseWebsiteProjectList(value: unknown): WebsiteProjectSummary[] {
  return z.array(websiteProjectSummarySchema).parse(value)
}
