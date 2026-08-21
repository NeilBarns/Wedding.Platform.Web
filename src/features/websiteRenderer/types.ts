import type { EventDetail } from '../events/types'
import type { WebsiteDraft } from '../websiteEditor/types'
import type { ResponsiveViewport } from '../websiteEditor/types'

export type WebsiteRendererProps = {
  event: Pick<EventDetail, 'id' | 'name' | 'eventDate' | 'type'>
  website: WebsiteDraft
  mode?: 'editor' | 'public'
  selectedSectionId?: string | null
  onSectionSelect?: (sectionId: string) => void
  targetViewport?: ResponsiveViewport
}
