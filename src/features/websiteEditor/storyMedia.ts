import type { SectionMedia, StoryBlock, StoryContent } from './types'

export function storyElementMedia(content: StoryContent, element: StoryBlock): SectionMedia {
  if (!element.media) return null

  return { assetId: element.media.mediaId, ...content.mediaFraming[element.id] }
}
