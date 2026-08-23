export type SectionMedia = { assetId: string; focalPoint?: { x: number; y: number }; zoom?: number } | null
type WithMedia = { media?: SectionMedia }
export type HeroContent = { headline: string; subheadline: string } & WithMedia
export type DateContent = { heading: string; description: string }
export type StoryBlock = { id: string; heading?: string | null; body: string; media?: SectionMedia }
export type StoryContent = { heading: string; intro?: string | null; blocks: StoryBlock[] }
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
export type MediaSpacingValue = 'none' | 'small' | 'medium' | 'large'
export type MediaSpacing = { top: MediaSpacingValue; right: MediaSpacingValue; bottom: MediaSpacingValue; left: MediaSpacingValue }
export type MediaContentGap = 'tight' | 'comfortable' | 'spacious' | 'generous'
export type ResponsiveViewport = 'desktop' | 'tablet' | 'mobile'
export type WebsiteSectionResponsiveAppearance = {
  mediaPlacement?: string
  mediaSize?: string
  mediaContentGap?: string
  headingAlignment?: string
  bodyAlignment?: string
  mediaSpacing?: { top: string; right: string; bottom: string; left: string }
}
export type WebsiteSectionAppearance = {
  headingAlignment: SectionAlignment
  bodyAlignment: SectionAlignment
  backgroundTreatment: BackgroundTreatment
  emphasis: SectionEmphasis
  presentation?: string
  mediaPlacement?: string
  mediaSize?: string
  frameStyle?: string
  cornerStyle?: string
  shadowStyle?: string
  overlayStrength?: number
  foregroundColor?: string
  mediaSpacing?: MediaSpacing
  mediaContentGap?: MediaContentGap
  responsive?: Partial<Record<'tablet' | 'mobile', WebsiteSectionResponsiveAppearance>>
}
export type WebsiteSectionPresentationOption = {
  key: string
  displayName: string
  description: string
  preview: string
  mediaControls: WebsiteSectionMediaControls | null
}
export type MediaControlOptionGroup = { default: string; options: DesignOption[] }
export type ResponsiveMediaControls = {
  mediaPlacement?: MediaControlOptionGroup
  mediaSize?: MediaControlOptionGroup
  mediaContentGap?: MediaControlOptionGroup
  headingAlignment?: MediaControlOptionGroup
  bodyAlignment?: MediaControlOptionGroup
  mediaSpacing?: { default: MediaSpacing; options: DesignOption[] }
}
export type WebsiteSectionMediaControls = {
  mediaPlacements?: MediaControlOptionGroup
  mediaSizes?: MediaControlOptionGroup
  frameStyles?: MediaControlOptionGroup
  cornerStyles?: MediaControlOptionGroup
  shadowStyles?: MediaControlOptionGroup
  overlayStrength?: { default: number; min: number; max: number; step: number }
  foregroundColors?: MediaControlOptionGroup
  mediaSpacing?: { default: MediaSpacing; options: DesignOption[] }
  mediaContentGaps?: MediaControlOptionGroup
  responsive?: Partial<Record<'tablet' | 'mobile', ResponsiveMediaControls>>
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
  name: string
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
