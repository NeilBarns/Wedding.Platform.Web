import type { WebsiteElement } from '../websiteElements/types'
import type { ResponsiveViewport } from '../websiteEditor/types'
import type { AppearanceControlCapability, PresentationCapability, SectionCapability, TemplateCapabilities } from './types'

export function sectionCapability(capabilities: TemplateCapabilities, sectionId: string): SectionCapability | undefined {
  return capabilities.sections.find((section) => section.id === sectionId)
}

export function presentationCapability(section: SectionCapability, presentationId?: string): PresentationCapability | undefined {
  const id = presentationId ?? section.defaultPresentation
  return section.presentations.find((presentation) => presentation.id === id)
}

export function controlsForViewport(
  section: SectionCapability,
  presentation: PresentationCapability | undefined,
  viewport: ResponsiveViewport,
): AppearanceControlCapability[] {
  return [...section.appearanceControls, ...(presentation?.appearanceControls ?? [])].map((control) => {
    if (viewport === 'desktop' || control.type === 'number') return control
    if (control.type === 'option') {
      const narrowing = control.viewports?.[viewport]
      return narrowing ? { ...control, default: narrowing.default, options: narrowing.options, viewports: undefined } : control
    }
    const narrowing = control.viewports?.[viewport]
    return narrowing ? { ...control, default: narrowing.default, options: narrowing.options, viewports: undefined } : control
  })
}

export function elementCapability(section: SectionCapability, elementType: WebsiteElement['type']): WebsiteElement['type'] | undefined {
  return section.elements?.allowedTypes.find((type) => type === elementType)
}
