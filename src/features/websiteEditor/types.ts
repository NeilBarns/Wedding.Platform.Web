export type SectionMedia = { assetId: string; focalPoint?: { x: number; y: number } } | null
type WithMedia = { media?: SectionMedia }
export type HeroContent = { headline: string; subheadline: string } & WithMedia
export type DateContent = { heading: string; description: string }
export type StoryContent = { heading: string; body: string } & WithMedia
export type ScheduleContent = { heading: string; items: Array<{ time: string; title: string; description: string }> }
export type VenueContent = { heading: string; name: string; address: string; description: string } & WithMedia
export type DressCodeContent = { heading: string; description: string }
export type PeoplePerson = { id: string; name: string; role?: string | null; media?: SectionMedia }
export type PeopleGroup = { id: string; name: string; people: PeoplePerson[] }
export type PeopleContent = { heading: string; groups: PeopleGroup[] }
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
  appearance: WebsiteSectionAppearance
  appearanceOptions: WebsiteSectionAppearanceOptions | null
  mediaCapability: { mode: 'single' | 'multiple' } | null
  itemMediaCapability: { itemType: 'person'; mode: 'single' } | null
  presentationCapability: WebsiteSectionPresentationCapability | null
}

export type SectionAlignment = 'inherit' | 'left' | 'center' | 'right'
export type BackgroundTreatment = 'inherit' | 'plain' | 'soft' | 'accent'
export type SectionEmphasis = 'inherit' | 'standard' | 'featured' | 'subtle'
export type WebsiteSectionAppearance = {
  headingAlignment: SectionAlignment
  bodyAlignment: SectionAlignment
  backgroundTreatment: BackgroundTreatment
  emphasis: SectionEmphasis
  presentation?: string
}
export type WebsiteSectionPresentationOption = {
  key: string
  displayName: string
  description: string
  preview: string
}
export type WebsiteSectionPresentationCapability = {
  default: string
  options: WebsiteSectionPresentationOption[]
}
export type WebsiteSectionAppearanceOptions = {
  headingAlignments: DesignOption[]
  bodyAlignments: DesignOption[]
  backgroundTreatments: DesignOption[]
  emphasisOptions: DesignOption[]
}

export type WebsiteSection =
  | SectionBase<'hero', HeroContent>
  | SectionBase<'date', DateContent>
  | SectionBase<'story', StoryContent>
  | SectionBase<'schedule', ScheduleContent>
  | SectionBase<'venue', VenueContent>
  | SectionBase<'dressCode', DressCodeContent>
  | SectionBase<'people', PeopleContent>
  | SectionBase<'gallery', GalleryContent>
  | SectionBase<'faq', FaqContent>
  | SectionBase<'rsvp', RsvpContent>
  | SectionBase<string, Record<string, unknown>>

export type ColorTheme = string
export type FontSet = string
export type ArtStyle = string
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
  media: Record<string, ResolvedWebsiteMedia>
}

export type ResolvedWebsiteMedia = {
  id: string
  originalFilename: string
  width: number
  height: number
  web: { width: number; height: number; url: string }
}
