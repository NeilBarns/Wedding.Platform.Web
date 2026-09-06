export const WEBSITE_ELEMENT_TYPES = [
  'heading',
  'text',
  'richText',
  'image',
  'media',
  'divider',
  'quote',
  'cta',
  'mediaCollection',
  'narrativeBlock',
  'compositionGroup',
  'eventDate',
  'eventTime',
  'countdown',
] as const

export const WEBSITE_LEAF_ELEMENT_TYPES = WEBSITE_ELEMENT_TYPES.filter(
  (type) => type !== 'compositionGroup',
)

export const CTA_ACTION_TYPES = [
  'rsvp',
  'scrollToSection',
  'viewVenue',
  'viewSchedule',
  'viewGallery',
  'backToTop',
  'externalUrl',
] as const

// Reserved product vocabulary only. These are not accepted WebsiteElement variants in B2.
export const DEFERRED_WEBSITE_ELEMENT_TYPES = ['video', 'locationSummary', 'logoMonogram'] as const

export const WEBSITE_ELEMENT_LIMITS = {
  id: 255,
  shortText: 255,
  text: 5000,
  richText: 20000,
  narrativeBody: 10000,
  externalUrl: 2048,
} as const
