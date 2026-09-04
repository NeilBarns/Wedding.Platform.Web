import type { EventDetail } from '../events/types'
import type { WebsiteDraft } from '../websiteEditor/types'
import type { ResponsiveViewport } from '../websiteEditor/types'
import type { WebsiteElement } from '../websiteElements/types'

export type WebsiteRenderScope =
  | { kind: 'full' }
  | { kind: 'single-section'; sectionId: string }

export type WebsiteRendererProps = {
  event: Pick<EventDetail, 'id' | 'name' | 'eventDate' | 'type'>
  website: WebsiteDraft
  mode?: 'editor' | 'public'
  selectedSectionId?: string | null
  onSectionSelect?: (sectionId: string) => void
  targetViewport?: ResponsiveViewport
  scope?: WebsiteRenderScope
  selectedNarrativeBlockId?: string | null
  onNarrativeBlockSelect?: (blockId: string) => void
  selectedElementId?: string | null
  onElementSelect?: (sectionId: string, elementId: string) => void
  onElementEdit?: (sectionId: string, elementId: string) => void
  onElementChange?: (sectionId: string, element: WebsiteElement) => void
}
