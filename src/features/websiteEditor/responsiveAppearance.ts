import type {
  ResponsiveViewport,
  WebsiteSectionAppearance,
  WebsiteSectionResponsiveAppearance,
} from './types'

export function resolveSectionAppearanceForViewport(
  appearance: WebsiteSectionAppearance,
  viewport: ResponsiveViewport,
  templateDefaults: WebsiteSectionResponsiveAppearance = {},
): WebsiteSectionAppearance {
  const { responsive, ...base } = appearance

  if (viewport === 'desktop') return base

  return {
    ...base,
    ...templateDefaults,
    ...(responsive?.[viewport] ?? {}),
  } as WebsiteSectionAppearance
}

export function pruneResponsiveAppearance(appearance: WebsiteSectionAppearance): WebsiteSectionAppearance {
  const responsive = Object.fromEntries(
    Object.entries(appearance.responsive ?? {}).filter(([, override]) => override && Object.keys(override).length > 0),
  ) as WebsiteSectionAppearance['responsive']
  const next = { ...appearance }
  if (responsive && Object.keys(responsive).length > 0) next.responsive = responsive
  else delete next.responsive
  return next
}

export function appearanceEquals(left: WebsiteSectionAppearance, right: WebsiteSectionAppearance): boolean {
  return stableStringify(pruneResponsiveAppearance(left)) === stableStringify(pruneResponsiveAppearance(right))
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`
  }
  return JSON.stringify(value)
}
