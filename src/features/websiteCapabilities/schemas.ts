import { z } from 'zod'
import { WEBSITE_ELEMENT_TYPES } from '../websiteElements/constants'

export const APPEARANCE_CONTROL_IDS = [
  'headingAlignment',
  'bodyAlignment',
  'backgroundTreatment',
  'emphasis',
  'presentation',
  'mediaPlacement',
  'mediaSize',
  'frameStyle',
  'cornerStyle',
  'shadowStyle',
  'overlayStrength',
  'foregroundColor',
  'mediaSpacing',
  'mediaContentGap',
] as const

const optionSchema = z.object({ key: z.string().min(1), displayName: z.string().min(1) }).strict()
const globalDesignControlBase = {
  default: z.string().min(1),
  options: z.array(optionSchema).min(1),
}

export const globalDesignControlCapabilitySchema = z.discriminatedUnion('type', [
  z.object({
    ...globalDesignControlBase,
    id: z.literal('colorTheme'),
    type: z.literal('palettePreset'),
  }).strict(),
  z.object({
    ...globalDesignControlBase,
    id: z.literal('fontSet'),
    type: z.literal('typographyPairing'),
  }).strict(),
  z.object({
    ...globalDesignControlBase,
    id: z.literal('artStyle'),
    type: z.literal('artStyle'),
  }).strict(),
]).superRefine((control, context) => {
  const keys = control.options.map((option) => option.key)
  if (new Set(keys).size !== keys.length) {
    context.addIssue({ code: 'custom', message: 'Global design option keys must be unique', path: ['options'] })
  }
  if (!keys.includes(control.default)) {
    context.addIssue({ code: 'custom', message: 'Global design default must be an allowed option', path: ['default'] })
  }
})

export const globalDesignCapabilitySchema = z.object({
  controls: z.tuple([
    globalDesignControlCapabilitySchema,
    globalDesignControlCapabilitySchema,
    globalDesignControlCapabilitySchema,
  ]),
}).strict().superRefine((capability, context) => {
  const expected = ['colorTheme', 'fontSet', 'artStyle'] as const
  expected.forEach((id, index) => {
    if (capability.controls[index].id !== id) {
      context.addIssue({ code: 'custom', message: `Expected ${id} global design control`, path: ['controls', index, 'id'] })
    }
  })
})
const viewportOptionSchema = z.object({
  default: z.string().min(1),
  options: z.array(optionSchema).min(1),
}).strict()
const spacingValueSchema = z.enum(['none', 'small', 'medium', 'large'])
const spacingSchema = z.object({
  top: spacingValueSchema,
  right: spacingValueSchema,
  bottom: spacingValueSchema,
  left: spacingValueSchema,
}).strict()
const viewportSpacingSchema = z.object({
  default: spacingSchema,
  options: z.array(optionSchema).min(1),
}).strict()
const viewportOptions = <T extends z.ZodType>(schema: T) => z.object({
  tablet: schema.optional(),
  mobile: schema.optional(),
}).strict().optional()
const controlBase = {
  id: z.enum(APPEARANCE_CONTROL_IDS),
  scope: z.enum(['shared', 'responsive']),
}

export const appearanceControlCapabilitySchema = z.discriminatedUnion('type', [
  z.object({
    ...controlBase,
    type: z.literal('option'),
    default: z.string().min(1),
    options: z.array(optionSchema).min(1),
    viewports: viewportOptions(viewportOptionSchema),
  }).strict(),
  z.object({
    ...controlBase,
    type: z.literal('number'),
    default: z.number(),
    minimum: z.number(),
    maximum: z.number(),
    step: z.number().positive(),
  }).strict(),
  z.object({
    ...controlBase,
    type: z.literal('spacing'),
    default: spacingSchema,
    options: z.array(optionSchema).min(1),
    viewports: viewportOptions(viewportSpacingSchema),
  }).strict(),
])

export const presentationCapabilitySchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().min(1),
  preview: z.string().min(1),
  appearanceControls: z.array(appearanceControlCapabilitySchema),
}).strict()

export const sectionCapabilitySchema = z.object({
  id: z.string().min(1),
  appearanceControls: z.array(appearanceControlCapabilitySchema),
  defaultPresentation: z.string().min(1).nullable(),
  presentations: z.array(presentationCapabilitySchema),
  elements: z.object({
    allowedTypes: z.array(z.enum(WEBSITE_ELEMENT_TYPES)),
    maxCount: z.number().int().positive(),
    compositionGroups: z.null(),
  }).strict().nullable(),
}).strict()

export const templateCapabilitiesSchema = z.object({
  globalDesign: globalDesignCapabilitySchema,
  elements: z.array(z.enum(WEBSITE_ELEMENT_TYPES)),
  sections: z.array(sectionCapabilitySchema),
}).strict()
