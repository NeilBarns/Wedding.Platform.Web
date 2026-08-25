export type InlineFieldPath = readonly (string | number)[]

type InlineTargetBase = {
  sectionId: string
  path: InlineFieldPath
  label: string
  multiline?: boolean
}

export type InlineEditingTarget = InlineTargetBase & (
  | { narrativeBlockId: string; slot: 'eyebrow' | 'heading' | 'body' | 'quote' | 'caption' }
  | { narrativeBlockId?: never; slot?: never }
)

export function inlineTargetKey(target: InlineEditingTarget) {
  return target.narrativeBlockId
    ? `${target.sectionId}:${target.narrativeBlockId}:${target.slot}`
    : `${target.sectionId}:${target.path.join('.')}`
}
