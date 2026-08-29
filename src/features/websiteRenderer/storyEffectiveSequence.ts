import type { ElementCapability } from '../websiteCapabilities/types'
import { narrativeIdFromStoryReference, resolveStoryStructure, storyFieldFromReference } from '../websiteEditor/storyStructure'
import type { StoryBlock, StoryContent, StoryHeaderField, StoryStructureReference } from '../websiteEditor/types'
import { resolveNarrativeComposition, type NarrativePresentation, type ResolvedNarrativeComposition } from './narrativeComposition'

export type StoryUnitChoreographyContext = {
  effectiveIndex: number
  effectiveCount: number
  hasPredecessor: boolean
  hasSuccessor: boolean
  previousKind?: EffectiveStoryUnit['kind']
  nextKind?: EffectiveStoryUnit['kind']
  previousPresentation?: NarrativePresentation
  nextPresentation?: NarrativePresentation
}

export type StoryBlockChoreographyContext = StoryUnitChoreographyContext

export type EffectiveStorySingleton = {
  kind: 'singleton'
  reference: StoryStructureReference
  field: StoryHeaderField
  choreography: StoryUnitChoreographyContext
}

export type EffectiveStoryNarrative = {
  kind: 'narrative'
  reference: StoryStructureReference
  block: StoryBlock
  authoredIndex: number
  composition: ResolvedNarrativeComposition
  choreography: StoryUnitChoreographyContext
}

export type EffectiveStoryUnit = EffectiveStorySingleton | EffectiveStoryNarrative

export function resolveStoryHeaderParticipation(content: Pick<StoryContent, 'eyebrow' | 'eyebrowIsHidden' | 'heading' | 'intro' | 'headingIsHidden' | 'introIsHidden'>) {
  const eyebrow = content.eyebrowIsHidden !== true && Boolean(content.eyebrow?.trim())
  const heading = content.headingIsHidden !== true && content.heading.trim().length > 0
  const intro = content.introIsHidden !== true && Boolean(content.intro?.trim())
  return { eyebrow, heading, intro, header: eyebrow || heading || intro }
}

export function resolveEffectiveStorySequence({
  content,
  capability,
  isMediaRenderable,
}: {
  content: StoryContent
  capability?: NonNullable<ElementCapability['narrativeBlock']>['composition']
  isMediaRenderable: (block: StoryBlock) => boolean
}): EffectiveStoryUnit[] {
  const participation = resolveStoryHeaderParticipation(content)
  const blocks = new Map(content.elements.map((block, index) => [block.id, { block, authoredIndex: index }]))
  const effective = resolveStoryStructure(content).flatMap((reference): Array<Omit<EffectiveStorySingleton, 'choreography'> | Omit<EffectiveStoryNarrative, 'choreography'>> => {
    const field = storyFieldFromReference(reference)
    if (field) return participation[field] ? [{ kind: 'singleton', reference, field }] : []
    const id = narrativeIdFromStoryReference(reference)
    const entry = id ? blocks.get(id) : undefined
    if (!entry || entry.block.isHidden || !capability) return []
    const composition = resolveNarrativeComposition({ block: entry.block, capability, mediaRenderable: isMediaRenderable(entry.block) })
    return Object.values(composition.rendering.slots).some(Boolean)
      ? [{ kind: 'narrative', reference, ...entry, composition }]
      : []
  })

  return effective.map((entry, effectiveIndex): EffectiveStoryUnit => {
    const previous = effective[effectiveIndex - 1]
    const next = effective[effectiveIndex + 1]
    return {
      ...entry,
      choreography: {
        effectiveIndex,
        effectiveCount: effective.length,
        hasPredecessor: Boolean(previous),
        hasSuccessor: Boolean(next),
        ...(previous ? { previousKind: previous.kind } : {}),
        ...(next ? { nextKind: next.kind } : {}),
        ...(previous?.kind === 'narrative' ? { previousPresentation: previous.composition.effective.presentation } : {}),
        ...(next?.kind === 'narrative' ? { nextPresentation: next.composition.effective.presentation } : {}),
      },
    } as EffectiveStoryUnit
  })
}
