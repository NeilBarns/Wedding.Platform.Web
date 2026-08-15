export type InlineFieldPath = readonly (string | number)[]

export type InlineFieldTarget = {
  sectionId: string
  path: InlineFieldPath
  label: string
  multiline?: boolean
}

export function inlineTargetKey(target: Pick<InlineFieldTarget, 'sectionId' | 'path'>) {
  return `${target.sectionId}:${target.path.join('.')}`
}
