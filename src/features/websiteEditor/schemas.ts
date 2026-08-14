import { z } from 'zod'
import type { WebsiteDraft, WebsiteSection } from './types'

const text = z.string()
export const heroContentSchema = z.object({ headline: text, subheadline: text }).strict()
export const dateContentSchema = z.object({ heading: text, description: text }).strict()
export const storyContentSchema = z.object({ heading: text, body: text }).strict()
export const scheduleContentSchema = z.object({
  heading: text,
  items: z.array(z.object({ time: text, title: text, description: text }).strict()),
}).strict()
export const venueContentSchema = z.object({ heading: text, name: text, address: text, description: text }).strict()
export const dressCodeContentSchema = z.object({ heading: text, description: text }).strict()
export const galleryContentSchema = z.object({ heading: text, items: z.tuple([]) }).strict()
export const faqContentSchema = z.object({
  heading: text,
  items: z.array(z.object({ question: text, answer: text }).strict()),
}).strict()
export const rsvpContentSchema = z.object({ heading: text, description: text, buttonLabel: text }).strict()

const contentSchemas: Record<string, z.ZodType> = {
  hero: heroContentSchema,
  date: dateContentSchema,
  story: storyContentSchema,
  schedule: scheduleContentSchema,
  venue: venueContentSchema,
  dressCode: dressCodeContentSchema,
  gallery: galleryContentSchema,
  faq: faqContentSchema,
  rsvp: rsvpContentSchema,
}

const sectionSchema = z.object({
  id: z.string(), type: z.string(), displayName: z.string(), sortOrder: z.number(),
  isEnabled: z.boolean(), content: z.record(z.string(), z.unknown()),
})

const draftSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  templateKey: z.string(),
  designSettings: z.object({
    colorTheme: z.enum(['terracotta', 'olive', 'sage', 'burgundy', 'neutral']),
    fontSet: z.enum(['editorial', 'romantic', 'modern']),
    artStyle: z.enum(['minimal', 'botanical', 'woven', 'clean']),
  }).strict(),
  template: z.object({
    key: z.string(),
    displayName: z.string(),
    designOptions: z.object({
      colorThemes: z.array(z.object({ key: z.string(), displayName: z.string() })),
      fontSets: z.array(z.object({ key: z.string(), displayName: z.string() })),
      artStyles: z.array(z.object({ key: z.string(), displayName: z.string() })),
    }),
  }).nullable(),
  sections: z.array(sectionSchema),
})

export function parseWebsiteDraft(value: unknown): WebsiteDraft {
  const draft = draftSchema.parse(value)
  const sections = draft.sections.map((section) => {
    const schema = contentSchemas[section.type]
    if (!schema) return section as WebsiteSection
    return { ...section, content: schema.parse(section.content) } as WebsiteSection
  })
  return { ...draft, sections }
}
