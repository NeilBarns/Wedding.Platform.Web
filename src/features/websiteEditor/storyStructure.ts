import type {
  StoryContent,
  StoryHeaderField,
  StoryNarrativeReference,
  StoryStructureReference,
} from './types'

export const STORY_SINGLETON_REFERENCES = [
  'story:eyebrow',
  'story:heading',
  'story:intro',
] as const satisfies readonly StoryStructureReference[]

export const narrativeStoryReference = (blockId: string): StoryNarrativeReference =>
  `narrative:${blockId}`

export function narrativeIdFromStoryReference(reference: string): string | null {
  return reference.startsWith('narrative:') && reference.length > 'narrative:'.length
    ? reference.slice('narrative:'.length)
    : null
}

export function storyFieldFromReference(reference: string): StoryHeaderField | null {
  if (reference === 'story:eyebrow') return 'eyebrow'
  if (reference === 'story:heading') return 'heading'
  if (reference === 'story:intro') return 'intro'
  return null
}

export function defaultStoryStructure(content: Pick<StoryContent, 'elements'>): StoryStructureReference[] {
  return [
    ...STORY_SINGLETON_REFERENCES,
    ...content.elements.map(({ id }) => narrativeStoryReference(id)),
  ]
}

export function isCanonicalStoryStructure(
  content: Pick<StoryContent, 'elements'>,
  order: readonly string[],
): order is StoryStructureReference[] {
  if (order.length !== content.elements.length + STORY_SINGLETON_REFERENCES.length || order.length > 23) return false
  if (new Set(order).size !== order.length) return false
  if (!STORY_SINGLETON_REFERENCES.every((reference) => order.includes(reference))) return false
  const projected = order.flatMap((reference) => {
    const id = narrativeIdFromStoryReference(reference)
    return id === null ? [] : [id]
  })
  if (projected.length !== content.elements.length) return false
  if (projected.some((id, index) => id !== content.elements[index]?.id)) return false
  return order.every((reference) =>
    storyFieldFromReference(reference) !== null || narrativeIdFromStoryReference(reference) !== null,
  )
}

export function resolveStoryStructure(content: StoryContent): StoryStructureReference[] {
  return content.structureOrder && isCanonicalStoryStructure(content, content.structureOrder)
    ? [...content.structureOrder]
    : defaultStoryStructure(content)
}

export function projectNarrativeStoryOrder(order: readonly StoryStructureReference[]): string[] {
  return order.flatMap((reference) => {
    const id = narrativeIdFromStoryReference(reference)
    return id === null ? [] : [id]
  })
}

function synchronizeStoryOrder(content: StoryContent, order: StoryStructureReference[]): StoryContent {
  const byId = new Map(content.elements.map((block) => [block.id, block]))
  const elements = projectNarrativeStoryOrder(order).flatMap((id) => {
    const block = byId.get(id)
    return block ? [block] : []
  })
  return { ...content, elements, structureOrder: order }
}

export function reorderStoryStructure(content: StoryContent, active: StoryStructureReference, over: StoryStructureReference) {
  const order = resolveStoryStructure(content)
  const from = order.indexOf(active)
  const to = order.indexOf(over)
  if (from < 0 || to < 0 || from === to) return content
  const [item] = order.splice(from, 1)
  order.splice(to, 0, item)
  return synchronizeStoryOrder(content, order)
}

export function moveStoryStructure(content: StoryContent, reference: StoryStructureReference, direction: -1 | 1) {
  const order = resolveStoryStructure(content)
  const index = order.indexOf(reference)
  const target = index + direction
  if (index < 0 || target < 0 || target >= order.length) return content
  return reorderStoryStructure(content, reference, order[target])
}

export function insertStoryNarrative(
  content: StoryContent,
  block: StoryContent['elements'][number],
  after: StoryStructureReference | null,
) {
  const order = resolveStoryStructure(content)
  const insertionIndex = after === null ? order.length : order.indexOf(after) + 1
  const reference = narrativeStoryReference(block.id)
  order.splice(insertionIndex > 0 ? insertionIndex : order.length, 0, reference)
  return synchronizeStoryOrder({ ...content, elements: [...content.elements, block] }, order)
}

export function removeStoryNarrative(content: StoryContent, blockId: string) {
  const reference = narrativeStoryReference(blockId)
  const order = resolveStoryStructure(content)
  const index = order.indexOf(reference)
  if (index < 0) return null
  order.splice(index, 1)
  const mediaFraming = { ...content.mediaFraming }
  delete mediaFraming[blockId]
  const nextContent = synchronizeStoryOrder(
    { ...content, elements: content.elements.filter(({ id }) => id !== blockId), mediaFraming },
    order,
  )
  return {
    content: nextContent,
    selectedReference: order[index] ?? order[index - 1] ?? null,
  }
}
