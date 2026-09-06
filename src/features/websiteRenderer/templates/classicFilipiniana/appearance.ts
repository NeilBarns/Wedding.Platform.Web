import type { CSSProperties } from 'react'
import type { WebsiteDesignSettings, WebsiteSectionAppearance } from '../../../websiteEditor/types'
import { resolveStoryCustomBackground } from '../../storyCustomBackground'
import type { TemplateDesignLibrary } from '../../../websiteCapabilities/types'
import type { ProjectColor } from '../../../websiteColors/projectColors'

export type ResolvedSectionAppearance = {
  sectionClass: string
  sectionStyle?: CSSProperties
}

const headingAlignmentClasses = {
  left: '[&_[data-section-heading]]:text-left [&_[data-section-heading]_*]:text-left',
  center: '[&_[data-section-heading]]:text-center [&_[data-section-heading]_*]:text-center',
  right: '[&_[data-section-heading]]:text-right [&_[data-section-heading]_*]:text-right',
} as const
const bodyAlignmentClasses = {
  left: '[&_[data-section-body]]:text-left [&_[data-section-body]_*]:text-left',
  center: '[&_[data-section-body]]:text-center [&_[data-section-body]_*]:text-center',
  right: '[&_[data-section-body]]:text-right [&_[data-section-body]_*]:text-right',
} as const

export function resolveClassicFilipinianaSectionAppearance(
  sectionType: string,
  _design: WebsiteDesignSettings,
  appearance: WebsiteSectionAppearance,
  _index: number,
  library: TemplateDesignLibrary,
  projectColors: readonly ProjectColor[],
): ResolvedSectionAppearance {
  const defaultBodyAlignment = sectionType === 'schedule' || sectionType === 'faq' ? 'left' : 'center'
  const heading = appearance.headingAlignment === 'inherit' ? 'center' : appearance.headingAlignment
  const body = appearance.bodyAlignment === 'inherit' ? defaultBodyAlignment : appearance.bodyAlignment
  const customBackground = resolveStoryCustomBackground(sectionType, appearance, library, projectColors)
  const background = appearance.backgroundTreatment === 'inherit' || appearance.backgroundTreatment === 'custom' ? classicBackgroundDefault(sectionType) : appearance.backgroundTreatment
  const emphasis = sectionType === 'story' || appearance.emphasis === 'inherit' ? 'standard' : appearance.emphasis

  const backgroundResult = resolveBackground(background)
  const emphasisClass = emphasis === 'featured'
    ? 'border-b-2 [&_[data-section-specialized-content]]:py-24'
    : emphasis === 'subtle' ? 'opacity-[0.92] [&_[data-section-specialized-content]]:py-14' : ''
  return {
    sectionClass: `${backgroundResult.className} ${headingAlignmentClasses[heading]} ${bodyAlignmentClasses[body]} ${emphasisClass}`,
    sectionStyle: customBackground ? { ...backgroundResult.style, ...customBackground } : backgroundResult.style,
  }
}

function classicBackgroundDefault(sectionType: string): 'plain' | 'soft' {
  return ['date', 'venue', 'people', 'rsvp'].includes(sectionType) ? 'soft' : 'plain'
}

function resolveBackground(background: 'plain' | 'soft' | 'accent'): { className: string; style?: CSSProperties } {
  if (background === 'plain') return { className: 'bg-[var(--cf-theme-page)]' }
  if (background === 'soft') return { className: 'bg-[color-mix(in_srgb,var(--cf-theme-surface)_58%,var(--cf-theme-page))]' }
  return {
    className: 'bg-[var(--cf-theme-accent)] [&_[data-rsvp-button]]:bg-white [&_[data-rsvp-button]]:text-[var(--cf-theme-accent)]',
    style: {
      '--cf-text': 'var(--cf-theme-accent-contrast)',
      '--cf-muted': 'rgb(255 255 255 / 82%)',
      '--cf-surface': 'rgb(0 0 0 / 12%)',
      '--cf-accent': 'var(--cf-theme-accent-contrast)',
      '--cf-secondary': 'rgb(255 255 255 / 76%)',
      '--cf-border': 'rgb(255 255 255 / 68%)',
    } as CSSProperties,
  }
}
