import type {
  ResponsiveViewport,
  WebsiteSectionAppearance,
  WebsiteSectionMediaControls,
  WebsiteSectionResponsiveAppearance,
} from './types'

const responsiveSettings = ['mediaPlacement', 'mediaSize', 'mediaContentGap', 'headingAlignment', 'bodyAlignment', 'mediaSpacing'] as const

export function responsiveTemplateDefaults(
  controls: WebsiteSectionMediaControls | null,
  viewport: Exclude<ResponsiveViewport, 'desktop'>,
): WebsiteSectionResponsiveAppearance {
  const viewportControls = controls?.responsive?.[viewport]
  const defaults: WebsiteSectionResponsiveAppearance = {
    headingAlignment: viewportControls?.headingAlignment?.default ?? 'inherit',
    bodyAlignment: viewportControls?.bodyAlignment?.default ?? 'inherit',
  }
  const groups = [
    ['mediaPlacement', 'mediaPlacements'],
    ['mediaSize', 'mediaSizes'],
    ['mediaContentGap', 'mediaContentGaps'],
  ] as const
  for (const [setting, group] of groups) {
    const value = viewportControls?.[setting]?.default ?? controls?.[group]?.default
    if (value !== undefined) defaults[setting] = value
  }
  const spacing = viewportControls?.mediaSpacing?.default ?? controls?.mediaSpacing?.default
  if (spacing !== undefined) defaults.mediaSpacing = spacing
  return defaults
}

export function resolveSectionAppearanceForViewport(
  appearance: WebsiteSectionAppearance,
  viewport: ResponsiveViewport,
  controls: WebsiteSectionMediaControls | null,
): WebsiteSectionAppearance {
  const { responsive, ...base } = appearance

  if (viewport === 'desktop') return base

  const independent = { ...base }
  for (const setting of responsiveSettings) delete independent[setting]

  return {
    ...independent,
    ...responsiveTemplateDefaults(controls, viewport),
    ...(responsive?.[viewport] ?? {}),
  } as WebsiteSectionAppearance
}

export function canonicalizeResponsiveAppearance(
  appearance: WebsiteSectionAppearance,
  controls: WebsiteSectionMediaControls | null,
): WebsiteSectionAppearance {
  const responsive = { ...appearance.responsive }
  for (const viewport of ['tablet', 'mobile'] as const) {
    const defaults = responsiveTemplateDefaults(controls, viewport)
    const override = { ...responsive[viewport] }
    for (const setting of responsiveSettings) {
      if (override[setting] === undefined) continue
      if (!responsiveValueIsSupported(setting, override[setting], controls, viewport) || valuesEqual(override[setting], defaults[setting])) delete override[setting]
    }
    if (Object.keys(override).length > 0) responsive[viewport] = override
    else delete responsive[viewport]
  }
  return pruneResponsiveAppearance({ ...appearance, responsive })
}

function responsiveValueIsSupported(
  setting: keyof WebsiteSectionResponsiveAppearance,
  value: WebsiteSectionResponsiveAppearance[keyof WebsiteSectionResponsiveAppearance],
  controls: WebsiteSectionMediaControls | null,
  viewport: Exclude<ResponsiveViewport, 'desktop'>,
): boolean {
  if (setting === 'headingAlignment' || setting === 'bodyAlignment') return typeof value === 'string'
  const viewportControls = controls?.responsive?.[viewport]
  if (setting === 'mediaSpacing') {
    const control = viewportControls?.mediaSpacing ?? controls?.mediaSpacing
    return Boolean(control && value && typeof value === 'object' && Object.values(value).every((side) => control.options.some((option) => option.key === side)))
  }
  const group = setting === 'mediaPlacement' ? controls?.mediaPlacements
    : setting === 'mediaSize' ? controls?.mediaSizes
      : controls?.mediaContentGaps
  const control = viewportControls?.[setting] ?? group
  return typeof value === 'string' && Boolean(control?.options.some((option) => option.key === value))
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
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
