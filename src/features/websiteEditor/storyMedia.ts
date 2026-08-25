import type { SectionMedia, StoryBlock, StoryContent } from './types'

export function storyElementMedia(content: StoryContent, element: StoryBlock): SectionMedia {
  const media = element.slots.media
  if (media.isHidden || media.content?.type !== 'image') return null

  return { assetId: media.content.mediaId, ...content.mediaFraming[element.id] }
}
