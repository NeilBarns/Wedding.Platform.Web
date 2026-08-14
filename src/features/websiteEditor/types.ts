export type HeroContent = { headline: string; subheadline: string }
export type DateContent = { heading: string; description: string }
export type StoryContent = { heading: string; body: string }
export type ScheduleContent = { heading: string; items: Array<{ time: string; title: string; description: string }> }
export type VenueContent = { heading: string; name: string; address: string; description: string }
export type DressCodeContent = { heading: string; description: string }
export type GalleryContent = { heading: string; items: [] }
export type FaqContent = { heading: string; items: Array<{ question: string; answer: string }> }
export type RsvpContent = { heading: string; description: string; buttonLabel: string }

type SectionBase<TType extends string, TContent> = {
  id: string
  type: TType
  displayName: string
  sortOrder: number
  isEnabled: boolean
  content: TContent
}

export type WebsiteSection =
  | SectionBase<'hero', HeroContent>
  | SectionBase<'date', DateContent>
  | SectionBase<'story', StoryContent>
  | SectionBase<'schedule', ScheduleContent>
  | SectionBase<'venue', VenueContent>
  | SectionBase<'dressCode', DressCodeContent>
  | SectionBase<'gallery', GalleryContent>
  | SectionBase<'faq', FaqContent>
  | SectionBase<'rsvp', RsvpContent>
  | SectionBase<string, Record<string, unknown>>

export type ColorTheme = 'terracotta' | 'olive' | 'sage' | 'burgundy' | 'neutral'
export type FontSet = 'editorial' | 'romantic' | 'modern'
export type ArtStyle = 'minimal' | 'botanical' | 'woven' | 'clean'
export type WebsiteDesignSettings = { colorTheme: ColorTheme; fontSet: FontSet; artStyle: ArtStyle }
export type DesignOption = { key: string; displayName: string }
export type WebsiteDesignOptions = {
  colorThemes: DesignOption[]
  fontSets: DesignOption[]
  artStyles: DesignOption[]
}
export type WebsiteTemplateSummary = { key: string; displayName: string; designOptions: WebsiteDesignOptions }

export type WebsiteDraft = {
  id: string
  eventId: string
  templateKey: string
  designSettings: WebsiteDesignSettings
  template: WebsiteTemplateSummary | null
  sections: WebsiteSection[]
}
