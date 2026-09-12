import type { HeroContent, ResolvedWebsiteMedia, ResponsiveViewport, WebsiteSection } from '../websiteEditor/types'
import type { TemplateDesignLibrary } from '../websiteCapabilities/types'
import type { ProjectColor } from '../websiteColors/projectColors'
import { BackgroundMediaLayer } from './BackgroundMediaLayer'
import { SectionDecorativeLayers } from './SectionDecorativeLayers'
import { SectionChildFlowRenderer } from './SectionChildFlowRenderer'
import { heroContentPositionStyle, resolveHeroContentPosition } from './heroContentPosition'
import { INNER_SPACING_CSS, resolveInnerSpacing } from '../websiteElements/group'

export function HeroSectionRenderer({ section, mode, viewport, templateKey, library, projectColors, media, eventDate, selectedElementId, onElementSelect, onElementEdit }: {
  section: WebsiteSection
  mode: 'editor' | 'public'
  viewport: ResponsiveViewport
  templateKey: string
  library: TemplateDesignLibrary
  projectColors: readonly ProjectColor[]
  media: Record<string, ResolvedWebsiteMedia>
  eventDate: string | null
  selectedElementId?: string | null
  onElementSelect?: (sectionId: string, elementId: string) => void
  onElementEdit?: (sectionId: string, elementId: string) => void
}) {
  const content = section.content as HeroContent
  const reference = content.backgroundMedia
  const decoration = section.appearance.decorativeAppearance
  const screen = section.appearance.height === 'screen'
  const hasChildren = content.childFlow.elements.length > 0
  const contentPosition = resolveHeroContentPosition(section.appearance, viewport)
  const positionStyle = heroContentPositionStyle(contentPosition)
  const innerSpacing = resolveInnerSpacing(section.appearance.innerSpacing, viewport === 'desktop' ? undefined : section.appearance.responsive?.[viewport]?.innerSpacing)
  const hasFullWidthGroup = content.childFlow.order.some((reference) => {
    if (reference.kind !== 'element') return false
    const element = content.childFlow.elements.find(({ id }) => id === reference.id)
    return element?.type === 'compositionGroup' && (element.layout?.width ?? 'full') === 'full'
  })

  return <div data-hero-shell data-section-full-bleed className={`relative isolate w-full overflow-hidden ${screen ? 'min-h-[100svh]' : ''}`}>
    <BackgroundMediaLayer ownerId={section.id} kind="hero" reference={reference} media={media} viewport={viewport} opacity={section.appearance.backgroundImageOpacity} />
    <SectionDecorativeLayers templateKey={templateKey} appearance={decoration} viewport={viewport} phase="background" />
    <div data-hero-foreground data-hero-content-position={contentPosition} className="relative z-10 flex min-h-[inherit] w-full flex-col box-border" style={{ ...positionStyle, paddingTop: INNER_SPACING_CSS[innerSpacing.top ?? 'none'], paddingRight: INNER_SPACING_CSS[innerSpacing.right ?? 'none'], paddingBottom: INNER_SPACING_CSS[innerSpacing.bottom ?? 'none'], paddingLeft: INNER_SPACING_CSS[innerSpacing.left ?? 'none'] }}>
      {mode === 'editor' && !hasChildren && <div data-empty-hero-section className="grid min-h-40 place-items-center rounded-md border border-dashed border-current/30 px-6 py-10 text-center"><div><p className="text-sm font-semibold">Empty Hero</p><p className="mt-1 text-xs opacity-70">Add a block to get started</p></div></div>}
      {hasChildren && <div data-hero-content-cluster style={{ width: hasFullWidthGroup ? '100%' : 'fit-content', maxWidth: '100%' }}><SectionChildFlowRenderer sectionId={section.id} flow={content.childFlow} specialized={null} mode={mode} viewport={viewport} templateKey={templateKey} library={library} projectColors={projectColors} media={media} eventDate={eventDate} context={section.resolvedDesignContext} selectedElementId={selectedElementId} onElementSelect={onElementSelect} onElementEdit={onElementEdit} /></div>}
    </div>
    <SectionDecorativeLayers templateKey={templateKey} appearance={decoration} viewport={viewport} phase="frame" />
  </div>
}
