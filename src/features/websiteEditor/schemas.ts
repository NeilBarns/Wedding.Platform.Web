import { z } from 'zod'
import type { WebsiteDraft, WebsiteSection } from './types'
import { CURRENT_WEBSITE_SCHEMA_VERSION } from './schema'
import { narrativeBlockElementSchema } from '../websiteElements/schemas'
import { templateCapabilitiesSchema } from '../websiteCapabilities/schemas'
import { matchesCurrentDesignCatalog } from '../websiteTemplates/design/catalogs'
import { globalDesignCapability, supportsGlobalDesignValue, sectionCapability } from '../websiteCapabilities/lookup'
import { isCanonicalStoryStructure } from './storyStructure'

const text = z.string()
const nonEmptyString = z.string().refine((value) => value.trim().length > 0, 'Required')
const semanticId = z.string().max(255).refine((value) => value.trim().length > 0, 'Required')
const requiredLabel = z.string().max(255).refine((value) => value.trim().length > 0, 'Required')
const designOptionSchema = z.object({ key: nonEmptyString, displayName: nonEmptyString }).strict()
const sectionMediaSchema = z.object({ assetId: nonEmptyString, focalPoint: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict().optional(), zoom: z.number().min(1).max(3).optional() }).strict().nullable().optional()
const responsiveMediaSpacingSchema = z.object({
  top: nonEmptyString,
  right: nonEmptyString,
  bottom: nonEmptyString,
  left: nonEmptyString,
}).strict()
const responsiveAppearanceSchema = z.object({
  mediaPlacement: nonEmptyString.optional(),
  mediaSize: nonEmptyString.optional(),
  mediaContentGap: nonEmptyString.optional(),
  headingAlignment: nonEmptyString.optional(),
  bodyAlignment: nonEmptyString.optional(),
  mediaSpacing: responsiveMediaSpacingSchema.optional(),
}).strict()
const responsiveControlSchema = z.object({
  mediaPlacement: z.object({ default: nonEmptyString, options: z.array(designOptionSchema).min(1) }).strict().optional(),
  mediaSize: z.object({ default: nonEmptyString, options: z.array(designOptionSchema).min(1) }).strict().optional(),
  mediaContentGap: z.object({ default: nonEmptyString, options: z.array(designOptionSchema).min(1) }).strict().optional(),
  headingAlignment: z.object({ default: nonEmptyString, options: z.array(designOptionSchema).min(1) }).strict().optional(),
  bodyAlignment: z.object({ default: nonEmptyString, options: z.array(designOptionSchema).min(1) }).strict().optional(),
  mediaSpacing: z.object({
    default: responsiveMediaSpacingSchema,
    options: z.array(designOptionSchema).min(1),
  }).strict().optional(),
}).strict()
export const heroContentSchema = z.object({ headline: text, subheadline: text, media: sectionMediaSchema }).strict()
export const dateContentSchema = z.object({ heading: text, description: text }).strict()
const storyMediaFramingSchema = z.object({
  focalPoint: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict().optional(),
  zoom: z.number().min(1).max(3).optional(),
}).strict()
const storyTextAppearanceSchema = z.object({
  fontFamilyId: z.string().min(1).max(255).optional(),
  fontSize: z.object({ desktop: z.enum(['xs', 's', 'm', 'l', 'xl']).optional(), tablet: z.enum(['xs', 's', 'm', 'l', 'xl']).optional(), mobile: z.enum(['xs', 's', 'm', 'l', 'xl']).optional() }).strict().optional(),
  lineSpacing: z.enum(['tight', 'normal', 'relaxed']).optional(),
  letterSpacing: z.enum(['tight', 'normal', 'wide']).optional(),
  colorId: z.string().min(1).max(255).optional(),
  alignment: z.enum(['start', 'center', 'end']).optional(),
}).strict()
export const storyContentSchema = z.object({
  eyebrow: text.max(255).nullable().optional(),
  eyebrowIsHidden: z.boolean().optional(),
  heading: text.max(255),
  intro: text.max(5000).nullable(),
  headingIsHidden: z.boolean().optional(),
  introIsHidden: z.boolean().optional(),
  singletonAppearance: z.object({ eyebrow: storyTextAppearanceSchema.optional(), heading: storyTextAppearanceSchema.optional(), intro: storyTextAppearanceSchema.optional() }).strict().optional(),
  elements: z.array(narrativeBlockElementSchema).max(20),
  mediaFraming: z.record(z.string(), storyMediaFramingSchema),
  structureOrder: z.array(z.string().min(1)).max(23).optional(),
}).strict().superRefine((content, context) => {
  const ids = new Set<string>()
  const imageIds = new Set<string>()
  content.elements.forEach((element, index) => {
    if (ids.has(element.id)) context.addIssue({ code: 'custom', message: 'Story element IDs must be unique', path: ['elements', index, 'id'] })
    ids.add(element.id)
    if (element.slots.media.content?.type === 'image') imageIds.add(element.id)
  })
  Object.keys(content.mediaFraming).forEach((id) => {
    if (!imageIds.has(id)) context.addIssue({ code: 'custom', message: 'Framing must reference a Story element with image media', path: ['mediaFraming', id] })
  })
  if (content.structureOrder && !isCanonicalStoryStructure(content, content.structureOrder)) {
    context.addIssue({ code: 'custom', message: 'Story structure order must be a complete canonical permutation', path: ['structureOrder'] })
  }
})
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
    mediaPlacement: nonEmptyString.optional(),
    mediaSize: nonEmptyString.optional(),
    frameStyle: nonEmptyString.optional(),
    cornerStyle: nonEmptyString.optional(),
    shadowStyle: nonEmptyString.optional(),
    overlayStrength: z.number().min(0).max(1).optional(),
    foregroundColor: nonEmptyString.optional(),
    mediaSpacing: z.object({
      top: z.enum(['none', 'small', 'medium', 'large']),
      right: z.enum(['none', 'small', 'medium', 'large']),
      bottom: z.enum(['none', 'small', 'medium', 'large']),
      left: z.enum(['none', 'small', 'medium', 'large']),
    }).strict().optional(),
    mediaContentGap: z.enum(['tight', 'comfortable', 'spacious', 'generous']).optional(),
    responsive: z.object({
      tablet: responsiveAppearanceSchema.optional(),
      mobile: responsiveAppearanceSchema.optional(),
    }).strict().optional(),
  }).strict(),
  designDefaults: z.object({
    headingFontId: nonEmptyString.optional(),
    bodyFontId: nonEmptyString.optional(),
    headingColorId: nonEmptyString.optional(),
    bodyColorId: nonEmptyString.optional(),
    accentColorId: nonEmptyString.optional(),
  }).strict().default({}),
  resolvedDesignContext: z.object({
    headingFontId: nonEmptyString,
    bodyFontId: nonEmptyString,
    headingColorId: nonEmptyString,
    bodyColorId: nonEmptyString,
    accentColorId: nonEmptyString,
  }).strict().nullable().default(null),
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
    options: z.array(z.object({
      key: nonEmptyString, displayName: nonEmptyString, description: nonEmptyString, preview: nonEmptyString,
      mediaControls: z.object({
        mediaPlacements: z.object({ default: nonEmptyString, options: z.array(designOptionSchema).min(1) }).strict().optional(),
        mediaSizes: z.object({ default: nonEmptyString, options: z.array(designOptionSchema).min(1) }).strict().optional(),
        frameStyles: z.object({ default: nonEmptyString, options: z.array(designOptionSchema).min(1) }).strict().optional(),
        cornerStyles: z.object({ default: nonEmptyString, options: z.array(designOptionSchema).min(1) }).strict().optional(),
        shadowStyles: z.object({ default: nonEmptyString, options: z.array(designOptionSchema).min(1) }).strict().optional(),
        overlayStrength: z.object({ default: z.number(), min: z.number(), max: z.number(), step: z.number().positive() }).strict().optional(),
        foregroundColors: z.object({ default: nonEmptyString, options: z.array(designOptionSchema).min(1) }).strict().optional(),
        mediaSpacing: z.object({
          default: z.object({
            top: z.enum(['none', 'small', 'medium', 'large']),
            right: z.enum(['none', 'small', 'medium', 'large']),
            bottom: z.enum(['none', 'small', 'medium', 'large']),
            left: z.enum(['none', 'small', 'medium', 'large']),
          }).strict(),
          options: z.array(designOptionSchema).min(1),
        }).strict().optional(),
        mediaContentGaps: z.object({ default: nonEmptyString, options: z.array(designOptionSchema).min(1) }).strict().optional(),
        responsive: z.object({
          tablet: responsiveControlSchema.optional(),
          mobile: responsiveControlSchema.optional(),
        }).strict().optional(),
      }).strict().nullable(),
    }).strict()).min(1),
  }).strict().nullable(),
})

const projectDesignDefaultOverridesSchema = z.object({
  headingFontId: nonEmptyString.optional(),
  bodyFontId: nonEmptyString.optional(),
  headingColorId: nonEmptyString.optional(),
  bodyColorId: nonEmptyString.optional(),
  accentColorId: nonEmptyString.optional(),
}).strict()
const legacyDesignSettingsSchema = z.object({
  colorTheme: nonEmptyString,
  fontSet: nonEmptyString,
  artStyle: nonEmptyString,
}).strict()
const currentDesignSettingsSchema = legacyDesignSettingsSchema.extend({
  projectDefaults: projectDesignDefaultOverridesSchema,
}).strict()

const draftCommonSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  name: nonEmptyString.max(100),
  templateKey: z.string(),
  projectDesignDefaults: z.object({
    headingFontId: nonEmptyString,
    bodyFontId: nonEmptyString,
    headingColorId: nonEmptyString,
    bodyColorId: nonEmptyString,
    accentColorId: nonEmptyString,
  }).strict().nullable(),
  template: z.object({
    key: nonEmptyString,
    displayName: nonEmptyString,
    designOptions: z.object({
      colorThemes: z.array(designOptionSchema).min(1),
      fontSets: z.array(designOptionSchema).min(1),
      artStyles: z.array(designOptionSchema).min(1),
    }).strict(),
    capabilities: templateCapabilitiesSchema,
  }).strict().nullable(),
  sections: z.array(sectionSchema),
  media: z.record(z.string(), z.object({
    id: z.string(), originalFilename: z.string(), width: z.number(), height: z.number(),
    web: z.object({ width: z.number(), height: z.number(), url: z.string().url() }).strict(),
  }).strict()),
}).strict()

const draftSchema = draftCommonSchema.extend({
  schemaVersion: z.literal(CURRENT_WEBSITE_SCHEMA_VERSION),
  designSettings: currentDesignSettingsSchema,
}).strict().transform((draft) => ({
  ...draft,
  designSettings: {
    ...draft.designSettings,
    projectDefaults: 'projectDefaults' in draft.designSettings ? draft.designSettings.projectDefaults : {},
  },
})).superRefine((draft, context) => {
  if (!draft.template) return

  const designCapability = globalDesignCapability(draft.template.capabilities)
  if (!draft.projectDesignDefaults) {
    context.addIssue({ code: 'custom', message: 'Resolved Project Design Defaults are required for a supported Template', path: ['projectDesignDefaults'] })
    return
  }
  const projectDesignDefaults = draft.projectDesignDefaults
  const library = draft.template.capabilities.designLibrary
  const capability = draft.template.capabilities.projectDefaults
  const familyIds = new Set(library.fontFamilies.map(({ id }) => id))
  const colorIds = new Set(library.colors.map(({ id }) => id))
  const resolvedChecks = [
    ['headingFontId', familyIds, capability.typography.headingFont.allowedFontIds],
    ['bodyFontId', familyIds, capability.typography.bodyFont.allowedFontIds],
    ['headingColorId', colorIds, capability.colors.headingColor.allowedColorIds],
    ['bodyColorId', colorIds, capability.colors.bodyColor.allowedColorIds],
    ['accentColorId', colorIds, capability.colors.accentColor.allowedColorIds],
  ] as const

  const overrideChecks = [
    ['headingFontId', capability.typography.headingFont.allowedFontIds],
    ['bodyFontId', capability.typography.bodyFont.allowedFontIds],
    ['headingColorId', capability.colors.headingColor.allowedColorIds],
    ['bodyColorId', capability.colors.bodyColor.allowedColorIds],
    ['accentColorId', capability.colors.accentColor.allowedColorIds],
  ] as const
  overrideChecks.forEach(([key, allowedIds]) => {
    const id = draft.designSettings.projectDefaults[key]
    if (id !== undefined && !allowedIds.includes(id)) {
      context.addIssue({ code: 'custom', message: 'Project Design Default override is not allowed by this Template', path: ['designSettings', 'projectDefaults', key] })
    }
  })
  resolvedChecks.forEach(([key, libraryIds, allowedIds]) => {
    const id = projectDesignDefaults[key]
    if (!libraryIds.has(id) || !allowedIds.includes(id)) {
      context.addIssue({ code: 'custom', message: 'Resolved Project Design Default is not allowed by this Template', path: ['projectDesignDefaults', key] })
    }
  })

  if (!matchesCurrentDesignCatalog(draft.template.key, draft.template.capabilities.designLibrary)) {
    context.addIssue({ code: 'custom', message: 'Template Design Library does not match the current renderer catalog', path: ['template', 'capabilities', 'designLibrary'] })
  }

  for (const setting of ['colorTheme', 'fontSet', 'artStyle'] as const) {
    const value = draft.designSettings[setting]
    if (!supportsGlobalDesignValue(designCapability, setting, value)) {
      context.addIssue({
        code: 'custom',
        message: 'Design setting is not supported by the selected Template',
        path: ['designSettings', setting],
      })
    }
  }

  draft.sections.forEach((section, index) => {
    const presentation = section.appearance.presentation
    const capability = sectionCapability(draft.template!.capabilities, section.type)
    const allowedContextValues = new Map<string, string[]>()
    capability?.contextDefaults.typography.forEach((control) => allowedContextValues.set(control.role === 'heading' ? 'headingFontId' : 'bodyFontId', control.allowedFontIds))
    capability?.contextDefaults.colors.forEach((control) => allowedContextValues.set(`${control.role}Id`, control.allowedColorIds))
    Object.entries(section.designDefaults).forEach(([key, id]) => {
      if (!allowedContextValues.get(key)?.includes(id)) {
        context.addIssue({ code: 'custom', message: 'Section Design Default is not allowed by this Template and Section', path: ['sections', index, 'designDefaults', key] })
      }
    })
    if (section.resolvedDesignContext) {
      const resolved = section.resolvedDesignContext
      for (const [key, libraryIds, allowedIds] of resolvedChecks) {
        if (!libraryIds.has(resolved[key]) || !allowedIds.includes(resolved[key])) {
          context.addIssue({ code: 'custom', message: 'Resolved Section Design Context is not allowed by this Template', path: ['sections', index, 'resolvedDesignContext', key] })
        }
      }
    }
    if (presentation && !capability?.presentations.some((option) => option.id === presentation)) {
      context.addIssue({
        code: 'custom',
        message: 'Presentation is not supported by the selected Template',
        path: ['sections', index, 'appearance', 'presentation'],
      })
    }
  })
})

export function normalizeWebsiteDraftFromApi(value: unknown): WebsiteDraft {
  const draft = draftSchema.parse(value)
  const sections = draft.sections.map((section) => {
    const schema = contentSchemas[section.type]
    if (!schema) return section as WebsiteSection
    return { ...section, content: schema.parse(section.content) } as WebsiteSection
  })
  return { ...draft, sections }
}
