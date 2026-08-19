import { z } from 'zod'
import type { WebsiteDraft, WebsiteSection } from './types'

const text = z.string()
const nonEmptyString = z.string().refine((value) => value.trim().length > 0, 'Required')
const semanticId = z.string().max(255).refine((value) => value.trim().length > 0, 'Required')
const requiredLabel = z.string().max(255).refine((value) => value.trim().length > 0, 'Required')
const designOptionSchema = z.object({ key: nonEmptyString, displayName: nonEmptyString }).strict()
const sectionMediaSchema = z.object({ assetId: nonEmptyString, focalPoint: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict().optional(), zoom: z.number().min(1).max(3).optional() }).strict().nullable().optional()
export const heroContentSchema = z.object({ headline: text, subheadline: text, media: sectionMediaSchema }).strict()
export const dateContentSchema = z.object({ heading: text, description: text }).strict()
export const storyContentSchema = z.object({ heading: text, body: text, media: sectionMediaSchema }).strict()
export const scheduleContentSchema = z.object({
  heading: text,
  items: z.array(z.object({ time: text, title: text, description: text }).strict()),
}).strict()
export const venueContentSchema = z.object({ heading: text, name: text, address: text, description: text, media: sectionMediaSchema }).strict()
export const dressCodeContentSchema = z.object({ heading: text, description: text }).strict()
const peoplePersonSchema = z.object({ id: semanticId, name: requiredLabel, role: text.max(255).nullable().optional(), media: sectionMediaSchema }).strict()
const peopleGroupSchema = z.object({ id: semanticId, name: requiredLabel, people: z.array(peoplePersonSchema).max(100) }).strict()
export const peopleContentSchema = z.object({
  heading: text.max(255),
  groups: z.array(peopleGroupSchema).max(30),
}).strict().superRefine((content, context) => {
  const groupIds = new Set<string>()
  const personIds = new Set<string>()
  content.groups.forEach((group, groupIndex) => {
    if (groupIds.has(group.id)) context.addIssue({ code: 'custom', message: 'Group IDs must be unique', path: ['groups', groupIndex, 'id'] })
    groupIds.add(group.id)
    group.people.forEach((person, personIndex) => {
      if (personIds.has(person.id)) context.addIssue({ code: 'custom', message: 'Person IDs must be unique', path: ['groups', groupIndex, 'people', personIndex, 'id'] })
      personIds.add(person.id)
    })
  })
})
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
  people: peopleContentSchema,
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
    presentation: nonEmptyString.optional(),
  }).strict(),
  appearanceOptions: z.object({
    headingAlignments: z.array(z.object({ key: z.string(), displayName: z.string() }).strict()),
    bodyAlignments: z.array(z.object({ key: z.string(), displayName: z.string() }).strict()),
    backgroundTreatments: z.array(z.object({ key: z.string(), displayName: z.string() }).strict()),
    emphasisOptions: z.array(z.object({ key: z.string(), displayName: z.string() }).strict()),
  }).strict().nullable(),
  mediaCapability: z.object({ mode: z.enum(['single', 'multiple']) }).strict().nullable(),
  itemMediaCapability: z.object({ itemType: z.literal('person'), mode: z.literal('single') }).strict().nullable(),
  presentationCapability: z.object({
    default: nonEmptyString,
    options: z.array(z.object({ key: nonEmptyString, displayName: nonEmptyString, description: nonEmptyString, preview: nonEmptyString }).strict()).min(1),
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
  media: z.record(z.string(), z.object({
    id: z.string(), originalFilename: z.string(), width: z.number(), height: z.number(),
    web: z.object({ width: z.number(), height: z.number(), url: z.string().url() }).strict(),
  }).strict()),
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

  draft.sections.forEach((section, index) => {
    const presentation = section.appearance.presentation
    if (presentation && !section.presentationCapability?.options.some((option) => option.key === presentation)) {
      context.addIssue({
        code: 'custom',
        message: 'Presentation is not supported by the selected Template',
        path: ['sections', index, 'appearance', 'presentation'],
      })
    }
  })
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
