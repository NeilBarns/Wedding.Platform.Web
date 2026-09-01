import type { CSSProperties } from 'react'
import type { WebsiteSectionAppearance } from '../../../websiteEditor/types'
import { resolveStoryCustomBackground } from '../../storyCustomBackground'
import type { TemplateDesignLibrary } from '../../../websiteCapabilities/types'
import type { ProjectColor } from '../../../websiteColors/projectColors'

const headingAlignment = {
  left: '[&_[data-section-heading]]:text-left [&_[data-section-heading]_*]:text-left',
  center: '[&_[data-section-heading]]:text-center [&_[data-section-heading]_*]:text-center',
  right: '[&_[data-section-heading]]:text-right [&_[data-section-heading]_*]:text-right',
}
const bodyAlignment = {
  left: '[&_[data-section-body]]:text-left [&_[data-section-body]_*]:text-left',
  center: '[&_[data-section-body]]:text-center [&_[data-section-body]_*]:text-center',
  right: '[&_[data-section-body]]:text-right [&_[data-section-body]_*]:text-right',
}

export function resolveModernEditorialSectionAppearance(sectionType: string, appearance: WebsiteSectionAppearance, index: number, library: TemplateDesignLibrary, projectColors: readonly ProjectColor[]) {
  const heading = appearance.headingAlignment === 'inherit' ? (sectionType === 'hero' ? 'left' : index % 2 ? 'right' : 'left') : appearance.headingAlignment
  const body = appearance.bodyAlignment === 'inherit' ? 'left' : appearance.bodyAlignment
  const customBackground = resolveStoryCustomBackground(sectionType, appearance, library, projectColors)
  const background = appearance.backgroundTreatment === 'inherit' || appearance.backgroundTreatment === 'custom' ? (index % 3 === 1 ? 'soft' : 'plain') : appearance.backgroundTreatment
  const emphasis = sectionType === 'story' || appearance.emphasis === 'inherit' ? 'standard' : appearance.emphasis
  const backgroundResult = resolveBackground(background)

  return {
    sectionClass: `${backgroundResult.className} ${headingAlignment[heading]} ${bodyAlignment[body]} ${emphasis === 'featured' ? '[&_[data-section-content]]:py-28' : emphasis === 'subtle' ? 'opacity-90 [&_[data-section-content]]:py-14' : ''}`,
    sectionStyle: customBackground ? { ...backgroundResult.style, ...customBackground } : backgroundResult.style,
  }
}

function resolveBackground(background: 'plain' | 'soft' | 'accent'): { className: string; style?: CSSProperties } {
  if (background === 'plain') return { className: 'bg-[var(--me-page)]' }
  if (background === 'soft') return { className: 'bg-[var(--me-surface)]' }
  return {
    className: 'bg-[var(--me-accent)] [&_[data-rsvp-button]]:border-white [&_[data-rsvp-button]]:text-white',
    style: { '--me-text': 'var(--me-accent-contrast)', '--me-muted': 'rgb(255 255 255 / 76%)', '--me-border': 'rgb(255 255 255 / 55%)' } as CSSProperties,
  }
}
