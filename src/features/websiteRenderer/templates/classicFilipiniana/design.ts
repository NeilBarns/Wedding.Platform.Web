import type { CSSProperties } from 'react'
import type { WebsiteDesignSettings } from '../../../websiteEditor/types'
import { classicPaletteCatalog, classicTypographyCatalog } from '../../../websiteTemplates/design/catalogs'

const patterns: Record<string, string> = {
  minimal: 'radial-gradient(rgb(117 91 70 / 7%) 0.7px, transparent 0.7px)',
  botanical: 'radial-gradient(ellipse at 8% 4%, rgb(112 135 92 / 15%) 0 5%, transparent 5.5%), radial-gradient(ellipse at 94% 18%, rgb(157 91 69 / 12%) 0 7%, transparent 7.5%)',
  woven: 'linear-gradient(45deg, rgb(90 72 58 / 5%) 25%, transparent 25%, transparent 75%, rgb(90 72 58 / 5%) 75%), linear-gradient(45deg, rgb(90 72 58 / 5%) 25%, transparent 25%, transparent 75%, rgb(90 72 58 / 5%) 75%)',
  clean: 'none',
}

export function resolveClassicFilipinianaDesign(settings: WebsiteDesignSettings): CSSProperties {
  const palette = (classicPaletteCatalog[settings.colorTheme as keyof typeof classicPaletteCatalog] ?? classicPaletteCatalog.terracotta).tokens
  const fonts = classicTypographyCatalog[settings.fontSet as keyof typeof classicTypographyCatalog] ?? classicTypographyCatalog.editorial
  return {
    '--cf-page': palette.canvas,
    '--cf-surface': palette.surface,
    '--cf-text': palette.text,
    '--cf-muted': palette.textMuted,
    '--cf-accent': palette.accent,
    '--cf-theme-page': palette.canvas,
    '--cf-theme-surface': palette.surface,
    '--cf-theme-text': palette.text,
    '--cf-theme-muted': palette.textMuted,
    '--cf-theme-accent': palette.accent,
    '--cf-theme-secondary': palette.ornament,
    '--cf-theme-border': palette.border,
    '--cf-secondary': palette.ornament,
    '--cf-border': palette.border,
    '--cf-heading-font': fonts.heading,
    '--cf-body-font': fonts.body,
    backgroundImage: patterns[settings.artStyle] ?? patterns.minimal,
    backgroundSize: settings.artStyle === 'woven' ? '18px 18px' : settings.artStyle === 'minimal' ? '7px 7px' : '100% 100%',
  } as CSSProperties
}
