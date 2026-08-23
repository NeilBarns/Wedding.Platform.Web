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
const viewportOptionSchema = z.object({
  default: z.string().min(1),
  options: z.array(optionSchema).min(1),
}).strict()
const spacingSchema = z.object({
  top: z.string().min(1),
  right: z.string().min(1),
  bottom: z.string().min(1),
  left: z.string().min(1),
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
  elements: z.array(z.enum(WEBSITE_ELEMENT_TYPES)),
  sections: z.array(sectionCapabilitySchema),
}).strict()
