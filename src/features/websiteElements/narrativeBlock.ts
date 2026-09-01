import type { z } from 'zod'
import { legacyNarrativeBlockElementSchema, legacySlotNarrativeBlockElementSchema, narrativeBlockElementSchema } from './schemas'

export const NARRATIVE_SLOT_ORDER = ['eyebrow', 'heading', 'divider', 'body', 'quote', 'media', 'caption', 'cta'] as const

export type LegacyNarrativeBlockElement = z.infer<typeof legacyNarrativeBlockElementSchema>
export type NarrativeBlockElement = z.infer<typeof narrativeBlockElementSchema>

export function normalizeNarrativeBlock(element: unknown): NarrativeBlockElement {
  const canonical = narrativeBlockElementSchema.safeParse(element)
  if (canonical.success) return canonical.data

  const legacySlots = legacySlotNarrativeBlockElementSchema.safeParse(element)
  if (legacySlots.success) return { ...legacySlots.data, composition: {} }

  const legacy = legacyNarrativeBlockElementSchema.parse(element)
  return {
    id: legacy.id,
    type: 'narrativeBlock',
    isHidden: false,
    composition: {},
    slots: {
      eyebrow: { isHidden: true, text: '' },
      heading: { isHidden: false, text: legacy.heading ?? '' },
      divider: { isHidden: true },
      body: { isHidden: false, text: legacy.body },
      quote: { isHidden: true, text: '' },
      media: { isHidden: !legacy.media, content: legacy.media ?? null },
      caption: { isHidden: true, text: '' },
      cta: { isHidden: true, label: '', action: null },
    },
  }
}
