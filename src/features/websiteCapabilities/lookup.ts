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
  return [...section.appearanceControls, ...(presentation?.appearanceControls ?? [])]
    .map((control) => controlForViewport(control, viewport))
    .filter((control): control is AppearanceControlCapability => control !== undefined)
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

export function controlCapability(
  section: SectionCapability,
  controlId: AppearanceControlCapability['id'],
  presentationId?: string,
): AppearanceControlCapability | undefined {
  const presentation = presentationCapability(section, presentationId)
  return [...section.appearanceControls, ...(presentation?.appearanceControls ?? [])].find((control) => control.id === controlId)
}

export function controlForViewport(
  control: AppearanceControlCapability | undefined,
  viewport: ResponsiveViewport,
): AppearanceControlCapability | undefined {
  if (!control || viewport === 'desktop' || control.scope === 'shared' || control.type === 'number') return control
  const narrowing = control.viewports?.[viewport]
  if (!narrowing) return undefined
  if (control.type === 'option' && typeof narrowing.default === 'string') {
    return { ...control, default: narrowing.default, options: narrowing.options, viewports: undefined }
  }
  if (control.type === 'spacing' && typeof narrowing.default === 'object') {
    return { ...control, default: narrowing.default, options: narrowing.options, viewports: undefined }
  }
  return undefined
}

export function supportsControl(
  section: SectionCapability,
  controlId: AppearanceControlCapability['id'],
  presentationId?: string,
  viewport: ResponsiveViewport = 'desktop',
): boolean {
  return controlForViewport(controlCapability(section, controlId, presentationId), viewport) !== undefined
}

export function optionValues(control: AppearanceControlCapability | undefined) {
  return control?.type === 'option' || control?.type === 'spacing' ? control.options : []
}

export function controlDefault(control: AppearanceControlCapability | undefined): AppearanceControlCapability['default'] | undefined {
  return control?.default
}

export function isResponsiveControl(control: AppearanceControlCapability | undefined): boolean {
  return control?.scope === 'responsive'
}
