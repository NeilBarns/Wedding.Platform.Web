import type { CSSProperties } from 'react'
import type { ArtStyle, ColorTheme, FontSet, WebsiteDesignSettings } from '../../../websiteEditor/types'

const palettes: Record<ColorTheme, Record<string, string>> = {
  terracotta: { page: '#f8f0e4', surface: '#f1e5d5', text: '#3b312d', muted: '#6c5f57', accent: '#9d5b45', secondary: '#78805f', border: '#806d5e' },
  olive: { page: '#f4f1e5', surface: '#e8e4d2', text: '#34372c', muted: '#626454', accent: '#70764e', secondary: '#a06a4f', border: '#74745f' },
  sage: { page: '#f1f3e9', surface: '#e2e8d9', text: '#303a33', muted: '#5f6c63', accent: '#748a70', secondary: '#a86650', border: '#718075' },
  burgundy: { page: '#f7eeea', surface: '#ecddda', text: '#3d292d', muted: '#715d61', accent: '#7d3443', secondary: '#7b7955', border: '#82696d' },
  neutral: { page: '#f5f1eb', surface: '#e9e3dc', text: '#35312e', muted: '#69625d', accent: '#74645a', secondary: '#777363', border: '#7c746e' },
}

const typography: Record<FontSet, { heading: string; body: string }> = {
  editorial: { heading: 'Georgia, Cambria, "Times New Roman", serif', body: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  romantic: { heading: '"Palatino Linotype", Palatino, Book Antiqua, serif', body: 'Georgia, Cambria, serif' },
  modern: { heading: 'Inter, ui-sans-serif, system-ui, sans-serif', body: 'Inter, ui-sans-serif, system-ui, sans-serif' },
}

const patterns: Record<ArtStyle, string> = {
  minimal: 'radial-gradient(rgb(117 91 70 / 7%) 0.7px, transparent 0.7px)',
  botanical: 'radial-gradient(ellipse at 8% 4%, rgb(112 135 92 / 15%) 0 5%, transparent 5.5%), radial-gradient(ellipse at 94% 18%, rgb(157 91 69 / 12%) 0 7%, transparent 7.5%)',
  woven: 'linear-gradient(45deg, rgb(90 72 58 / 5%) 25%, transparent 25%, transparent 75%, rgb(90 72 58 / 5%) 75%), linear-gradient(45deg, rgb(90 72 58 / 5%) 25%, transparent 25%, transparent 75%, rgb(90 72 58 / 5%) 75%)',
  clean: 'none',
}

export function resolveClassicFilipinianaDesign(settings: WebsiteDesignSettings): CSSProperties {
  const palette = palettes[settings.colorTheme]
  const fonts = typography[settings.fontSet]
  return {
    '--cf-page': palette.page,
    '--cf-surface': palette.surface,
    '--cf-text': palette.text,
    '--cf-muted': palette.muted,
    '--cf-accent': palette.accent,
    '--cf-secondary': palette.secondary,
    '--cf-border': palette.border,
    '--cf-heading-font': fonts.heading,
    '--cf-body-font': fonts.body,
    backgroundImage: patterns[settings.artStyle],
    backgroundSize: settings.artStyle === 'woven' ? '18px 18px' : settings.artStyle === 'minimal' ? '7px 7px' : '100% 100%',
  } as CSSProperties
}

export const colorSwatches: Record<ColorTheme, string> = Object.fromEntries(
  Object.entries(palettes).map(([key, palette]) => [key, palette.accent]),
) as Record<ColorTheme, string>
