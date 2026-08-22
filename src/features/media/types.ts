export type MediaVariant = {
  width: number
  height: number
  url: string
}

type MediaWebsiteSectionUsageBase = {
  sectionId: string
  displayName: string
}

export type MediaPeopleUsageContext = { groupId: string; groupName: string; personId: string; personName: string }
export type MediaStoryUsageContext = { blockId: string; blockHeading?: string | null }

export type MediaWebsiteSectionUsage = MediaWebsiteSectionUsageBase & (
  | { type: 'people'; context: MediaPeopleUsageContext }
  | { type: 'story'; context: MediaStoryUsageContext }
  | { type: string; context?: undefined }
)

export function mediaUsageDetail(section: MediaWebsiteSectionUsage): string | null {
  if (section.type === 'people' && section.context) {
    return `${section.context.groupName} — ${section.context.personName}`
  }
  if (section.type === 'story' && section.context) {
    return section.context.blockHeading?.trim() || 'Story block'
  }
  return null
}

export function mediaUsageKey(section: MediaWebsiteSectionUsage): string {
  if (section.type === 'people' && section.context) return `${section.sectionId}:person:${section.context.personId}`
  if (section.type === 'story' && section.context) return `${section.sectionId}:block:${section.context.blockId}`
  return `${section.sectionId}:section`
}

export type MediaAssetUsage = {
  isInUse: boolean
  website: { sections: MediaWebsiteSectionUsage[] }
}

export type MediaAsset = {
  id: string
  originalFilename: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  width: number
  height: number
  sizeBytes: number
  createdAt: string
  variants: Record<string, MediaVariant> & { thumbnail: MediaVariant; web: MediaVariant }
  usage: MediaAssetUsage
}

export type MediaFilters = {
  search?: string
  type?: 'jpeg' | 'png' | 'webp'
  orientation?: 'landscape' | 'portrait' | 'square'
  uploaded?: 'today' | '7d' | '30d'
  page?: number
}

export type MediaPage = {
  assets: MediaAsset[]
  currentPage: number
  lastPage: number
  total: number
}
