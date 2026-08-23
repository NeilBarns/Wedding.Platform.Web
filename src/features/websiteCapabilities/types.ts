import { z } from 'zod'
import type {
  appearanceControlCapabilitySchema,
  presentationCapabilitySchema,
  sectionCapabilitySchema,
  templateCapabilitiesSchema,
} from './schemas'

export type AppearanceControlCapability = z.infer<typeof appearanceControlCapabilitySchema>
export type PresentationCapability = z.infer<typeof presentationCapabilitySchema>
export type SectionCapability = z.infer<typeof sectionCapabilitySchema>
export type TemplateCapabilities = z.infer<typeof templateCapabilitiesSchema>
