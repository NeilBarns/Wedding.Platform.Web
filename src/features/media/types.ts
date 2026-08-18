export type MediaVariant = {
  width: number
  height: number
  url: string
}

export type MediaWebsiteSectionUsage = {
  sectionId: string
  type: string
  displayName: string
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
