import type { WebsiteElement } from '../websiteElements/types'
import type { ResponsiveViewport, WebsiteSectionAppearanceOptions, WebsiteSectionMediaControls } from '../websiteEditor/types'
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

export function appearanceControl(
  section: SectionCapability,
  presentation: PresentationCapability | undefined,
  controlId: AppearanceControlCapability['id'],
  viewport: ResponsiveViewport = 'desktop',
): AppearanceControlCapability | undefined {
  return controlsForViewport(section, presentation, viewport).find((control) => control.id === controlId)
}

export function appearanceOptionsForSection(section: SectionCapability): WebsiteSectionAppearanceOptions {
  const options = (id: AppearanceControlCapability['id']) => {
    const control = section.appearanceControls.find((item) => item.id === id)
    return control?.type === 'option' ? control.options : []
  }
  return {
    headingAlignments: options('headingAlignment'),
    bodyAlignments: options('bodyAlignment'),
    backgroundTreatments: options('backgroundTreatment'),
    emphasisOptions: options('emphasis'),
  }
}

export function mediaControlsForPresentation(presentation: PresentationCapability | undefined): WebsiteSectionMediaControls | null {
  if (!presentation) return null
  const controls = new Map(presentation.appearanceControls.map((control) => [control.id, control]))
  const optionGroup = (id: AppearanceControlCapability['id']) => {
    const control = controls.get(id)
    return control?.type === 'option' ? { default: control.default, options: control.options } : undefined
  }
  const spacing = controls.get('mediaSpacing')
  const number = controls.get('overlayStrength')
  const responsive = Object.fromEntries((['tablet', 'mobile'] as const).flatMap((viewport) => {
    const narrowed = Object.fromEntries(presentation.appearanceControls.flatMap((control) => {
      if (control.type === 'number') return []
      const value = control.viewports?.[viewport]
      return value ? [[control.id, value]] : []
    }))
    return Object.keys(narrowed).length > 0 ? [[viewport, narrowed]] : []
  })) as NonNullable<WebsiteSectionMediaControls['responsive']>

  return {
    mediaPlacements: optionGroup('mediaPlacement'),
    mediaSizes: optionGroup('mediaSize'),
    frameStyles: optionGroup('frameStyle'),
    cornerStyles: optionGroup('cornerStyle'),
    shadowStyles: optionGroup('shadowStyle'),
    foregroundColors: optionGroup('foregroundColor'),
    mediaContentGaps: optionGroup('mediaContentGap'),
    mediaSpacing: spacing?.type === 'spacing' ? { default: spacing.default, options: spacing.options } : undefined,
    overlayStrength: number?.type === 'number' ? { default: number.default, min: number.minimum, max: number.maximum, step: number.step } : undefined,
    responsive: Object.keys(responsive).length > 0 ? responsive : undefined,
  }
}
