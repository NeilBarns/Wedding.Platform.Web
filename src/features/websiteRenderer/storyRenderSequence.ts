import { narrativeIdFromStoryReference, resolveStoryStructure, storyFieldFromReference } from '../websiteEditor/storyStructure'
import type { StoryBlock, StoryContent, StoryHeaderField, StoryStructureReference } from '../websiteEditor/types'
import type { EffectiveStoryNarrative, EffectiveStoryUnit } from './storyEffectiveSequence'

export type StorySingletonRun = {
  kind: 'singletonRun'
  fields: StoryHeaderField[]
  references: StoryStructureReference[]
  hasPredecessor: boolean
  hasSuccessor: boolean
}

export type StoryNarrativeRenderItem = {
  kind: 'narrative'
  block: StoryBlock
  effective?: EffectiveStoryNarrative
  hasPredecessor: boolean
  hasSuccessor: boolean
}

export type StoryRenderItem = StorySingletonRun | StoryNarrativeRenderItem

export function resolveStoryRenderItems(
  content: StoryContent,
  effective: EffectiveStoryUnit[],
  mode: 'editor' | 'public',
): StoryRenderItem[] {
  const effectiveByReference = new Map(effective.map((unit) => [unit.reference, unit]))
  const references = mode === 'public'
    ? effective.map(({ reference }) => reference)
    : resolveStoryStructure(content)
  const blocks = new Map(content.elements.map((block) => [block.id, block]))
  const raw: Array<Omit<StorySingletonRun, 'hasPredecessor' | 'hasSuccessor'> | Omit<StoryNarrativeRenderItem, 'hasPredecessor' | 'hasSuccessor'>> = []

  references.forEach((reference) => {
    const field = storyFieldFromReference(reference)
    if (field) {
      const previous = raw[raw.length - 1]
      if (previous?.kind === 'singletonRun') {
        previous.fields.push(field)
        previous.references.push(reference)
      } else raw.push({ kind: 'singletonRun', fields: [field], references: [reference] })
      return
    }
    const id = narrativeIdFromStoryReference(reference)
    const block = id ? blocks.get(id) : undefined
    if (!block) return
    const unit = effectiveByReference.get(reference)
    raw.push({ kind: 'narrative', block, ...(unit?.kind === 'narrative' ? { effective: unit } : {}) })
  })

  return raw.map((item, index) => ({
    ...item,
    hasPredecessor: index > 0,
    hasSuccessor: index < raw.length - 1,
  }))
}
