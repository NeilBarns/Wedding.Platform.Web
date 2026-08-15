import type { CSSProperties } from 'react'
import type { WebsiteDesignSettings } from '../../../websiteEditor/types'

const palettes: Record<string, Record<string, string>> = {
  ink: { page: '#f5f3ee', surface: '#e9e6df', text: '#171717', muted: '#65615b', accent: '#171717', border: '#908a80' },
  stone: { page: '#f3f1ed', surface: '#e4e0da', text: '#302e2a', muted: '#716c64', accent: '#686158', border: '#999188' },
  blush: { page: '#faf3f1', surface: '#f0dfdc', text: '#3b292b', muted: '#765f61', accent: '#9c5f64', border: '#b99191' },
  plum: { page: '#f7f2f6', surface: '#e9dde7', text: '#302330', muted: '#6e5a6c', accent: '#5f405f', border: '#927b8f' },
  navy: { page: '#f1f4f7', surface: '#dde4eb', text: '#182432', muted: '#596775', accent: '#263c5a', border: '#77889b' },
}

const fonts: Record<string, { heading: string; body: string }> = {
  editorial: { heading: 'Georgia, Cambria, "Times New Roman", serif', body: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  fashion: { heading: '"Bodoni 72", Didot, Georgia, serif', body: 'Arial Narrow, Inter, ui-sans-serif, sans-serif' },
  minimal: { heading: 'Inter, ui-sans-serif, system-ui, sans-serif', body: 'Inter, ui-sans-serif, system-ui, sans-serif' },
}

export function resolveModernEditorialDesign(settings: WebsiteDesignSettings): CSSProperties {
  const palette = palettes[settings.colorTheme] ?? palettes.ink
  const typography = fonts[settings.fontSet] ?? fonts.editorial
  return {
    '--me-page': palette.page,
    '--me-surface': palette.surface,
    '--me-text': palette.text,
    '--me-muted': palette.muted,
    '--me-accent': palette.accent,
    '--me-border': palette.border,
    '--me-heading-font': typography.heading,
    '--me-body-font': typography.body,
    '--me-rule-width': settings.artStyle === 'rule' ? '4px' : '1px',
    '--me-frame': settings.artStyle === 'frame' ? `inset 0 0 0 12px ${palette.page}, inset 0 0 0 13px ${palette.border}` : 'none',
    '--me-offset': settings.artStyle === 'offset' ? '2.5rem' : '0rem',
  } as CSSProperties
}
