import { z } from 'zod'
import type {
  appearanceControlCapabilitySchema,
  globalDesignCapabilitySchema,
  globalDesignControlCapabilitySchema,
  presentationCapabilitySchema,
  sectionCapabilitySchema,
  templateCapabilitiesSchema,
} from './schemas'

export type AppearanceControlCapability = z.infer<typeof appearanceControlCapabilitySchema>
export type GlobalDesignCapability = z.infer<typeof globalDesignCapabilitySchema>
export type GlobalDesignControlCapability = z.infer<typeof globalDesignControlCapabilitySchema>
export type PresentationCapability = z.infer<typeof presentationCapabilitySchema>
export type SectionCapability = z.infer<typeof sectionCapabilitySchema>
export type TemplateCapabilities = z.infer<typeof templateCapabilitiesSchema>
