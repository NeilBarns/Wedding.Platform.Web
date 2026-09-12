import type { BlankContent, HeroContent, ResolvedWebsiteMedia, WebsiteSection } from '../websiteEditor/types'
import type { WebsiteElement } from '../websiteElements/types'
import { isElementRenderable } from './elementRenderability'

export function hasIntentionalSectionSurface(section: WebsiteSection): boolean {
  if (section.appearance.backgroundTreatment !== 'inherit') return true
  const decorative = section.appearance.decorativeAppearance
  const background = decorative?.background
  return Boolean(
    background?.colorId
    || background?.customColor
    || (background?.texture && background.texture !== 'none')
    || (background?.pattern && background.pattern !== 'none')
    || (background?.overlay && background.overlay !== 'none')
    || (decorative?.frame?.style && decorative.frame.style !== 'none'),
  )
}

export function isHeroSectionRenderable(section: WebsiteSection, templateKey: string, media: Record<string, ResolvedWebsiteMedia>, eventDate: string | null): boolean {
  if (section.type !== 'hero') return true
  const content = section.content as HeroContent
  const isRenderable = (element: WebsiteElement): boolean => element.type === 'compositionGroup'
    ? element.children.some(isRenderable)
    : isElementRenderable(element, templateKey, 'public', media, eventDate)
  return content.childFlow.elements.some(isRenderable)
    || Boolean(content.backgroundMedia && media[content.backgroundMedia.assetId])
    || hasIntentionalSectionSurface(section)
    || section.appearance.height === 'screen'
}

export function isBlankSectionRenderable(
  section: WebsiteSection,
  templateKey: string,
  media: Record<string, ResolvedWebsiteMedia>,
  eventDate: string | null,
): boolean {
  if (section.type !== 'blank') return true
  const flow = (section.content as BlankContent).childFlow
  const isRenderable = (element: WebsiteElement): boolean => element.type === 'compositionGroup'
    ? element.children.some(isRenderable)
    : isElementRenderable(element, templateKey, 'public', media, eventDate)
  return flow.elements.some(isRenderable)
    || hasIntentionalSectionSurface(section)
}
