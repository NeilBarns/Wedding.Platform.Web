import type { CSSProperties } from 'react'
import type { WebsiteDesignSettings } from '../../../websiteEditor/types'
import { modernPaletteCatalog, modernTypographyCatalog } from '../../../websiteTemplates/design/catalogs'

export function resolveModernEditorialDesign(settings: WebsiteDesignSettings): CSSProperties {
  const palette = (modernPaletteCatalog[settings.colorTheme as keyof typeof modernPaletteCatalog] ?? modernPaletteCatalog.ink).tokens
  const typography = modernTypographyCatalog[settings.fontSet as keyof typeof modernTypographyCatalog] ?? modernTypographyCatalog.editorial
  return {
    '--me-page': palette.canvas,
    '--me-surface': palette.surface,
    '--me-text': palette.text,
    '--me-muted': palette.textMuted,
    '--me-accent': palette.accent,
    '--me-border': palette.border,
    '--me-heading-font': typography.heading,
    '--me-body-font': typography.body,
    '--me-rule-width': settings.artStyle === 'rule' ? '4px' : '1px',
    '--me-frame': settings.artStyle === 'frame' ? `inset 0 0 0 12px ${palette.canvas}, inset 0 0 0 13px ${palette.border}` : 'none',
    '--me-offset': settings.artStyle === 'offset' ? '2.5rem' : '0rem',
  } as CSSProperties
}
