import { createSemanticId } from './createSemanticId'
import type { StoryBlock, StoryContent } from './types'
import type { StoryStructureReference } from './types'
import {
  insertStoryNarrative,
  moveStoryStructure,
  narrativeStoryReference,
  removeStoryNarrative,
  reorderStoryStructure,
} from './storyStructure'

export const STORY_BLOCK_LIMIT = 20

export function createEmptyStoryBlock(): StoryBlock {
  return {
    id: createSemanticId('story'),
    type: 'narrativeBlock',
    isHidden: false,
    composition: {},
    slots: {
      eyebrow: { isHidden: true, text: '' },
      heading: { isHidden: true, text: '' },
      divider: { isHidden: true },
      body: { isHidden: true, text: '' },
      quote: { isHidden: true, text: '' },
      media: { isHidden: true, content: null },
      caption: { isHidden: true, text: '' },
      cta: { isHidden: true, label: '', action: null },
    },
  }
}

export function addStoryBlock(content: StoryContent, after: StoryStructureReference | null) {
  if (content.elements.length >= STORY_BLOCK_LIMIT) return null
  const block = createEmptyStoryBlock()
  return { content: insertStoryNarrative(content, block, after), blockId: block.id }
}

export function duplicateStoryBlock(content: StoryContent, sourceBlockId: string) {
  if (content.elements.length >= STORY_BLOCK_LIMIT) return null
  const sourceIndex = content.elements.findIndex(({ id }) => id === sourceBlockId)
  if (sourceIndex < 0) return null

  const block = structuredClone(content.elements[sourceIndex])
  block.id = createSemanticId('story')
  if (block.slots.media.content?.type === 'mediaCollection') {
    block.slots.media.content.items = block.slots.media.content.items.map((item) => ({
      ...item,
      id: createSemanticId('media-item'),
    }))
  }

  const nextContent = insertStoryNarrative(content, block, narrativeStoryReference(sourceBlockId))
  const framing = content.mediaFraming[sourceBlockId]
  return {
    content: {
      ...nextContent,
      mediaFraming: framing
        ? { ...content.mediaFraming, [block.id]: structuredClone(framing) }
        : content.mediaFraming,
    },
    blockId: block.id,
  }
}

export function removeStoryBlock(content: StoryContent, blockId: string) {
  return removeStoryNarrative(content, blockId)
}

export function moveStoryBlock(content: StoryContent, reference: StoryStructureReference, direction: -1 | 1) {
  return moveStoryStructure(content, reference, direction)
}

export function reorderStoryBlocks(content: StoryContent, active: StoryStructureReference, over: StoryStructureReference) {
  return reorderStoryStructure(content, active, over)
}
