import { z } from 'zod'
import type {
  compositionGroupSchema,
  ctaActionSchema,
  flowCompositionGroupSchema,
  websiteElementSchema,
  websiteLeafElementSchema,
  zonedCompositionGroupSchema,
} from './schemas'
export type { NarrativeBlockElement } from './narrativeBlock'

export type CtaAction = z.infer<typeof ctaActionSchema>
export type WebsiteLeafElement = z.infer<typeof websiteLeafElementSchema>
export type FlowCompositionGroup = z.infer<typeof flowCompositionGroupSchema>
export type ZonedCompositionGroup = z.infer<typeof zonedCompositionGroupSchema>
export type CompositionGroup = z.infer<typeof compositionGroupSchema>
export type WebsiteElement = z.infer<typeof websiteElementSchema>
