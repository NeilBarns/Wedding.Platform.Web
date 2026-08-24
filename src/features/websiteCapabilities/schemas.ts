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

const designColorSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  value: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  origin: z.literal('template'),
}).strict()

const typographyRoleSchema = z.enum(['heading', 'body'])
const fontFamilySchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  allowedRoles: z.array(typographyRoleSchema).min(1),
}).strict()
const paletteRolesSchema = z.object({
  canvas: z.string().min(1),
  surface: z.string().min(1),
  text: z.string().min(1),
  textMuted: z.string().min(1),
  accent: z.string().min(1),
  accentContrast: z.string().min(1),
  border: z.string().min(1),
  ornament: z.string().min(1).optional(),
}).strict()
const palettePresetSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  roles: paletteRolesSchema,
}).strict()
const typographyPresetSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  headingFontId: z.string().min(1),
  bodyFontId: z.string().min(1),
}).strict()

export const templateDesignLibrarySchema = z.object({
  colors: z.array(designColorSchema).min(1),
  fontFamilies: z.array(fontFamilySchema).min(1),
  palettePresets: z.array(palettePresetSchema).min(1),
  typographyPresets: z.array(typographyPresetSchema).min(1),
}).strict().superRefine((library, context) => {
  for (const collection of ['colors', 'fontFamilies', 'palettePresets', 'typographyPresets'] as const) {
    const ids = library[collection].map(({ id }) => id)
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: 'custom', message: `${collection} IDs must be unique`, path: [collection] })
    }
  }

  const colorIds = new Set(library.colors.map(({ id }) => id))
  library.palettePresets.forEach((preset, index) => {
    Object.entries(preset.roles).forEach(([role, colorId]) => {
      if (!colorIds.has(colorId)) context.addIssue({ code: 'custom', message: 'Unknown color reference', path: ['palettePresets', index, 'roles', role] })
    })
  })

  const families = new Map(library.fontFamilies.map((family) => [family.id, family]))
  library.typographyPresets.forEach((preset, index) => {
    if (!families.get(preset.headingFontId)?.allowedRoles.includes('heading')) {
      context.addIssue({ code: 'custom', message: 'Invalid heading font reference', path: ['typographyPresets', index, 'headingFontId'] })
    }
    if (!families.get(preset.bodyFontId)?.allowedRoles.includes('body')) {
      context.addIssue({ code: 'custom', message: 'Invalid body font reference', path: ['typographyPresets', index, 'bodyFontId'] })
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
  designLibrary: templateDesignLibrarySchema,
  elements: z.array(z.enum(WEBSITE_ELEMENT_TYPES)),
  sections: z.array(sectionCapabilitySchema),
}).strict().superRefine((capabilities, context) => {
  for (const [controlId, presets] of [
    ['colorTheme', capabilities.designLibrary.palettePresets],
    ['fontSet', capabilities.designLibrary.typographyPresets],
  ] as const) {
    const options = capabilities.globalDesign.controls.find(({ id }) => id === controlId)?.options ?? []
    if (options.length !== presets.length || options.some((option, index) => option.key !== presets[index]?.id || option.displayName !== presets[index]?.displayName)) {
      context.addIssue({ code: 'custom', message: `${controlId} options must match design-library presets`, path: ['globalDesign', 'controls'] })
    }
  }
})
