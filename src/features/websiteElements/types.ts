import { z } from 'zod'
import type {
  compositionGroupSchema,
  ctaActionSchema,
  websiteElementSchema,
  websiteLeafElementSchema,
  textElementSchema,
  richTextElementSchema,
  richTextDocumentSchema,
  dividerElementSchema,
  mediaElementSchema,
  dateElementSchema,
  accordionElementSchema,
  scheduleElementSchema,
  peopleElementSchema,
} from './schemas'
export type { NarrativeBlockElement } from './narrativeBlock'

export type CtaAction = z.infer<typeof ctaActionSchema>
export type WebsiteLeafElement = z.infer<typeof websiteLeafElementSchema>
export type CompositionGroup = z.infer<typeof compositionGroupSchema>
export type WebsiteElement = z.infer<typeof websiteElementSchema>
export type TextElement = z.infer<typeof textElementSchema>
export type RichTextElement = z.infer<typeof richTextElementSchema>
export type RichTextDocument = z.infer<typeof richTextDocumentSchema>
export type DividerElement = z.infer<typeof dividerElementSchema>
export type MediaElement = z.infer<typeof mediaElementSchema>
export type DateElement = z.infer<typeof dateElementSchema>
export type AccordionElement = z.infer<typeof accordionElementSchema>
export type ScheduleElement = z.infer<typeof scheduleElementSchema>
export type PeopleElement = z.infer<typeof peopleElementSchema>
