import { z } from 'zod'
import type { WebsiteDraft, WebsiteSection } from './types'

const text = z.string()
const nonEmptyString = z.string().refine((value) => value.trim().length > 0, 'Required')
const designOptionSchema = z.object({ key: nonEmptyString, displayName: nonEmptyString }).strict()
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

export function validateSectionContent(type: string, content: Record<string, unknown>) {
  const schema = contentSchemas[type]
  return schema ? schema.safeParse(content) : { success: false as const, error: null }
}

const sectionSchema = z.object({
  id: z.string(), type: z.string(), displayName: z.string(), sortOrder: z.number(),
  isEnabled: z.boolean(), content: z.record(z.string(), z.unknown()),
  appearance: z.object({
    headingAlignment: z.enum(['inherit', 'left', 'center', 'right']),
    bodyAlignment: z.enum(['inherit', 'left', 'center', 'right']),
    backgroundTreatment: z.enum(['inherit', 'plain', 'soft', 'accent']),
    emphasis: z.enum(['inherit', 'standard', 'featured', 'subtle']),
  }).strict(),
  appearanceOptions: z.object({
    headingAlignments: z.array(z.object({ key: z.string(), displayName: z.string() }).strict()),
    bodyAlignments: z.array(z.object({ key: z.string(), displayName: z.string() }).strict()),
    backgroundTreatments: z.array(z.object({ key: z.string(), displayName: z.string() }).strict()),
    emphasisOptions: z.array(z.object({ key: z.string(), displayName: z.string() }).strict()),
  }).strict().nullable(),
})

const draftSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  templateKey: z.string(),
  designSettings: z.object({
    colorTheme: nonEmptyString,
    fontSet: nonEmptyString,
    artStyle: nonEmptyString,
  }).strict(),
  template: z.object({
    key: nonEmptyString,
    displayName: nonEmptyString,
    designOptions: z.object({
      colorThemes: z.array(designOptionSchema).min(1),
      fontSets: z.array(designOptionSchema).min(1),
      artStyles: z.array(designOptionSchema).min(1),
    }).strict(),
  }).strict().nullable(),
  sections: z.array(sectionSchema),
}).superRefine((draft, context) => {
  if (!draft.template) return

  const optionGroups = {
    colorTheme: draft.template.designOptions.colorThemes,
    fontSet: draft.template.designOptions.fontSets,
    artStyle: draft.template.designOptions.artStyles,
  }

  for (const [setting, options] of Object.entries(optionGroups)) {
    const value = draft.designSettings[setting as keyof typeof draft.designSettings]
    if (!options.some((option) => option.key === value)) {
      context.addIssue({
        code: 'custom',
        message: 'Design setting is not supported by the selected Template',
        path: ['designSettings', setting],
      })
    }
  }
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
