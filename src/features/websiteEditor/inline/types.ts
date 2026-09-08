export type InlineFieldPath = readonly (string | number)[]

type InlineTargetBase = {
  sectionId: string
  path: InlineFieldPath
  label: string
  multiline?: boolean
}

export type InlineEditingTarget = InlineTargetBase & (
  | { narrativeBlockId: string; slot: 'eyebrow' | 'heading' | 'body' | 'quote' | 'caption'; elementId?: never }
  | { elementId: string; narrativeBlockId?: never; slot?: never }
  | { elementId?: never; narrativeBlockId?: never; slot?: never }
)

export function inlineTargetKey(target: InlineEditingTarget) {
  return target.narrativeBlockId
    ? `${target.sectionId}:${target.narrativeBlockId}:${target.slot}`
    : target.elementId
      ? `${target.sectionId}:element:${target.elementId}`
    : `${target.sectionId}:${target.path.join('.')}`
}

export function isStandaloneTextEditingTarget(target: InlineEditingTarget | null) {
  return Boolean(target?.elementId)
}
