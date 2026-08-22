import type { DateContent, DressCodeContent, FaqContent, GalleryContent, HeroContent, PeopleContent, ResolvedWebsiteMedia, ResponsiveViewport, RsvpContent, ScheduleContent, SectionMedia, StoryContent, VenueContent, WebsiteSection } from '../../websiteEditor/types'
import { formatDateOnly } from '../formatDateOnly'
import type { WebsiteRendererProps } from '../types'
import { ZoomedMediaImage } from '../ZoomedMediaImage'
import { resolveModernEditorialSectionAppearance } from './modernEditorial/appearance'
import { resolveModernEditorialDesign } from './modernEditorial/design'
import { ModernEditorialDate, ModernEditorialDressCode, ModernEditorialFaq, ModernEditorialGallery, ModernEditorialHero, ModernEditorialPeople, ModernEditorialRsvp, ModernEditorialSchedule, ModernEditorialStoryBlock, ModernEditorialStoryBlockBody, ModernEditorialStoryBlockHeading, ModernEditorialStoryHeader, ModernEditorialVenue } from './modernEditorial/sections'

export function ModernEditorialRenderer({ event, website, mode = 'public', selectedSectionId, onSectionSelect, targetViewport = 'desktop' }: WebsiteRendererProps) {
  const enabledSections = website.sections.filter(({ isEnabled }) => isEnabled)
  return <article className="min-h-full bg-[var(--me-page)] font-[family-name:var(--me-body-font)] text-[var(--me-text)]" style={resolveModernEditorialDesign(website.designSettings)}>
    {enabledSections.length === 0 && <div className="flex min-h-96 items-center justify-center px-8 text-center text-sm text-[var(--me-muted)]">Enabled sections will appear here.</div>}
    {enabledSections.map((section, index) => {
      const appearance = resolveModernEditorialSectionAppearance(section.type, section.appearance, index)
      const selected = mode === 'editor' && selectedSectionId === section.id
      return <section className={`${appearance.sectionClass} relative cursor-default border-b border-[var(--me-border)] transition-shadow ${selected ? 'z-10' : ''}`} style={appearance.sectionStyle} data-preview-section={section.id} key={section.id} onClick={mode === 'editor' ? () => onSectionSelect?.(section.id) : undefined} onKeyDown={mode === 'editor' ? (keyboardEvent) => { if (keyboardEvent.target !== keyboardEvent.currentTarget) return; if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') { keyboardEvent.preventDefault(); onSectionSelect?.(section.id) } } : undefined} role={mode === 'editor' ? 'group' : undefined} aria-label={mode === 'editor' ? `${section.displayName} section` : undefined} tabIndex={mode === 'editor' ? 0 : undefined}>
        {selected && <span className="absolute right-3 top-3 z-20 rounded-full bg-[var(--editor-chrome-strong)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--editor-chrome-on-strong)] shadow-[var(--editor-chrome-shadow)]">Editing</span>}
        <Section section={section} eventName={event.name} eventDate={event.eventDate} mode={mode} media={website.media} targetViewport={targetViewport} />
      </section>
    })}
  </article>
}

function Section({ section, eventName, eventDate, mode, media, targetViewport }: { section: WebsiteSection; eventName: string; eventDate: string | null; mode: 'editor' | 'public'; media: Record<string, ResolvedWebsiteMedia>; targetViewport: ResponsiveViewport }) {
  const date = formatDateOnly(eventDate)
  const presentation = section.appearance.presentation ?? section.presentationCapability?.default
  const present = (content: React.ReactNode) => <ModernMediaPresentation section={section} media={media} presentation={presentation} targetViewport={targetViewport}>{content}</ModernMediaPresentation>
  switch (section.type) {
    case 'hero': return present(<ModernEditorialHero sectionId={section.id} eventName={eventName} date={date} content={section.content as HeroContent} />)
    case 'date': return <ModernEditorialDate sectionId={section.id} date={date} content={section.content as DateContent} />
    case 'story': {
      const content = section.content as StoryContent
      return <><ModernEditorialStoryHeader sectionId={section.id} content={content} mode={mode} />{content.blocks.map((block, index) => <ModernMediaPresentation alternate={index % 2 === 1} key={block.id} section={section} media={media} mediaReference={block.media} mobileStoryHeading={<ModernEditorialStoryBlockHeading sectionId={section.id} block={block} index={index} />} mobileStoryBody={<ModernEditorialStoryBlockBody sectionId={section.id} block={block} index={index} />} presentation={presentation} targetViewport={targetViewport}><ModernEditorialStoryBlock sectionId={section.id} block={block} index={index} tabletEditorial={targetViewport === 'tablet' && presentation === 'editorial'} /></ModernMediaPresentation>)}</>
    }
    case 'schedule': return <ModernEditorialSchedule sectionId={section.id} content={section.content as ScheduleContent} />
    case 'venue': return present(<ModernEditorialVenue sectionId={section.id} content={section.content as VenueContent} />)
    case 'dressCode': return <ModernEditorialDressCode sectionId={section.id} content={section.content as DressCodeContent} />
    case 'people': return <ModernEditorialPeople sectionId={section.id} content={section.content as PeopleContent} mode={mode} media={media} showMedia={section.itemMediaCapability?.itemType === 'person'} presentation={presentation ?? 'editorialPortraits'} />
    case 'gallery': return <ModernEditorialGallery sectionId={section.id} content={section.content as GalleryContent} mode={mode} />
    case 'faq': return <ModernEditorialFaq sectionId={section.id} content={section.content as FaqContent} />
    case 'rsvp': return <ModernEditorialRsvp sectionId={section.id} content={section.content as RsvpContent} />
    default: return mode === 'editor' ? <div className="px-6 py-10 text-center text-sm text-[var(--me-muted)]">This section is not supported by this Template renderer.</div> : null
  }
}

function ModernMediaPresentation({ section, media, presentation, targetViewport, children, mediaReference: mediaReferenceOverride, alternate = false, mobileStoryHeading, mobileStoryBody }: { section: WebsiteSection; media: Record<string, ResolvedWebsiteMedia>; presentation?: string; targetViewport: ResponsiveViewport; children: React.ReactNode; mediaReference?: SectionMedia; alternate?: boolean; mobileStoryHeading?: React.ReactNode; mobileStoryBody?: React.ReactNode }) {
  const reference = mediaReferenceOverride === undefined ? (section.content as { media?: SectionMedia }).media : mediaReferenceOverride
  const asset = reference ? media[reference.assetId] : undefined
  if (!section.mediaCapability || !asset) return <>{children}</>
  const mediaReference = reference as NonNullable<SectionMedia>
  const controls = section.presentationCapability?.options.find((option) => option.key === presentation)?.mediaControls
  const value = (setting: keyof typeof section.appearance, group: 'mediaPlacements'|'mediaSizes'|'frameStyles'|'cornerStyles'|'shadowStyles'|'foregroundColors') => section.appearance[setting] ?? controls?.[group]?.default
  const configuredPlacement = value('mediaPlacement', 'mediaPlacements')
  const placement = alternate && configuredPlacement === 'left' ? 'right' : alternate && configuredPlacement === 'right' ? 'left' : configuredPlacement
  const size = value('mediaSize', 'mediaSizes')
  const frame = value('frameStyle', 'frameStyles')
  const corner = value('cornerStyle', 'cornerStyles')
  const shadow = value('shadowStyle', 'shadowStyles')
  const spacing = section.appearance.mediaSpacing ?? controls?.mediaSpacing?.default
  const contentGap = section.appearance.mediaContentGap ?? controls?.mediaContentGaps?.default
  const spacingValue = (side: 'top'|'right'|'bottom'|'left') => spacing?.[side] ?? 'medium'
  const spacingClass = `${spacingValue('top') === 'none' ? '' : spacingValue('top') === 'small' ? 'pt-2 sm:pt-3' : spacingValue('top') === 'large' ? 'pt-5 sm:pt-8' : 'pt-3 sm:pt-5'} ${spacingValue('right') === 'none' ? '' : spacingValue('right') === 'small' ? 'pr-2 sm:pr-3' : spacingValue('right') === 'large' ? 'pr-5 sm:pr-8' : 'pr-3 sm:pr-5'} ${spacingValue('bottom') === 'none' ? '' : spacingValue('bottom') === 'small' ? 'pb-2 sm:pb-3' : spacingValue('bottom') === 'large' ? 'pb-5 sm:pb-8' : 'pb-3 sm:pb-5'} ${spacingValue('left') === 'none' ? '' : spacingValue('left') === 'small' ? 'pl-2 sm:pl-3' : spacingValue('left') === 'large' ? 'pl-5 sm:pl-8' : 'pl-3 sm:pl-5'}`
  const gapClass = contentGap === 'tight' ? 'gap-3 sm:gap-4' : contentGap === 'spacious' ? 'gap-8 sm:gap-10' : contentGap === 'generous' ? 'gap-12 sm:gap-16' : 'gap-5 sm:gap-7'
  const decorationSafeAreaClass = modernDecorationSafeArea(typeof frame === 'string' ? frame : undefined, typeof placement === 'string' ? placement : undefined)
  const frameClass = frame === 'hairline'
    ? 'border border-[var(--me-border)] p-px'
    : frame === 'gallery'
      ? 'border-8 border-[var(--me-page)] outline outline-1 outline-[var(--me-border)]'
      : ''
  const cornerClass = corner === 'soft' ? 'rounded-sm' : corner === 'rounded' ? 'rounded-xl' : ''
  const shadowClass = shadow === 'subtle'
    ? 'shadow-[0_3px_8px_-3px_rgb(15_23_42/28%)]'
    : shadow === 'soft'
      ? 'shadow-[0_12px_30px_-10px_rgb(15_23_42/34%)]'
      : shadow === 'elevated'
        ? 'shadow-[0_24px_50px_-14px_rgb(15_23_42/40%),0_6px_14px_-6px_rgb(15_23_42/28%)]'
        : ''
  const decorativeFrameClass = frame === 'offset'
    ? `before:pointer-events-none before:absolute before:inset-0 ${placement === 'right' ? 'before:-translate-x-3' : 'before:translate-x-3'} before:translate-y-3 before:border-2 before:border-[var(--me-text)] before:content-[''] before:[border-radius:inherit] after:pointer-events-none after:absolute after:inset-0 after:z-[2] after:border after:border-[var(--me-border)] after:content-[''] after:[border-radius:inherit]`
    : frame === 'boldEdge'
      ? `after:pointer-events-none after:absolute after:inset-0 after:z-[2] after:border after:border-[var(--me-text)] ${placement === 'right' ? 'after:border-l-[6px]' : 'after:border-r-[6px]'} after:content-[''] after:[border-radius:inherit]`
      : ''
  const sizing = size === 'compact' ? 'mx-auto w-3/4' : size === 'balanced' ? 'mx-auto w-[90%]' : 'w-full'
  const splitStretchClass = targetViewport === 'mobile' ? '' : 'h-full'
  const image = (className: string, fill = false, applySizing = true, layoutClass = '', stretchWithSplit = false) => fill
    ? <ZoomedMediaImage className={className} fill height={asset.web.height} reference={mediaReference} src={asset.web.url} width={asset.web.width} />
    : <span className={`block ${applySizing ? sizing : 'w-full'} ${spacingClass} ${layoutClass} ${stretchWithSplit ? splitStretchClass : ''}`}><span className={`block w-full ${decorationSafeAreaClass} ${stretchWithSplit ? splitStretchClass : ''}`}><span className={`relative block w-full ${cornerClass} ${shadowClass} ${decorativeFrameClass} ${stretchWithSplit ? splitStretchClass : ''}`}><ModernOuterFrameDecoration frame={typeof frame === 'string' ? frame : undefined} placement={typeof placement === 'string' ? placement : undefined} /><ZoomedMediaImage className={`${className} relative z-[1] w-full ${frameClass} ${cornerClass}`} height={asset.web.height} reference={mediaReference} src={asset.web.url} width={asset.web.width} /></span></span></span>
  const splitGrid = modernSplitGrid(typeof placement === 'string' ? placement : 'left', typeof size === 'string' ? size : 'balanced', targetViewport)
  const mediaOrder = placement === 'right' ? semanticClass(targetViewport, 'order-2', 'order-2') : ''
  const copyOrder = placement === 'right' ? semanticClass(targetViewport, 'order-1', 'order-1') : ''

  if (section.type === 'story' && targetViewport === 'mobile' && mobileStoryBody !== undefined) {
    const mobileWidth = size === 'compact' ? 'w-[78%]' : size === 'feature' ? 'w-full' : 'w-[90%]'
    const imageClass = presentation === 'editorial' ? 'min-h-[28rem] max-h-[52rem]' : 'max-h-[36rem]'
    const storyMedia = <div className={`mx-auto ${mobileWidth}`}>{image(imageClass, false, false)}</div>
    return <div className={`grid py-12 ${gapClass}`}>{mobileStoryHeading ? <div className="px-7">{mobileStoryHeading}</div> : null}{storyMedia}<div className="px-7">{mobileStoryBody}</div></div>
  }

  if (presentation === 'scenic' || (section.type === 'hero' && presentation === 'immersive')) { const strength = section.appearance.overlayStrength ?? controls?.overlayStrength?.default ?? 0.5; const foreground = value('foregroundColor', 'foregroundColors') ?? '#FFFFFF'; return <div className="relative isolate min-h-[36rem] overflow-hidden">{image('h-full', true)}<div className="relative min-h-[36rem] backdrop-blur-[1px]" style={{ background: `color-mix(in srgb, var(--me-page) ${strength * 100}%, transparent)`, color: foreground, '--me-text': foreground, '--me-muted': foreground } as React.CSSProperties}>{children}</div></div> }
  if (presentation === 'editorial') {
    const hero = section.type === 'hero'
    const heroClass = targetViewport === 'mobile' ? 'min-h-[28rem] max-h-[52rem]' : 'h-full min-h-0 max-h-none'
    const media = image(hero ? heroClass : 'min-h-[28rem] max-h-[52rem]', false, false, mediaOrder, hero)
    const copy = <div className={copyOrder}>{children}</div>
    if (placement === 'top' || placement === 'bottom') return <div className={`grid ${gapClass}`}>{placement === 'top' ? <>{media}{copy}</> : <>{copy}{media}</>}</div>
    return <div className={`grid items-stretch ${gapClass} ${splitGrid}`}>{media}{copy}</div>
  }
  if (presentation === 'detailsFirst') { const media = image('min-h-[25rem] max-h-[44rem]', false, false, mediaOrder); const copy = <div className={copyOrder}>{children}</div>; if (placement === 'top' || placement === 'bottom') return <div className={`grid ${gapClass}`}>{placement === 'top' ? <>{media}{copy}</> : <>{copy}{media}</>}</div>; return <div className={`grid items-stretch ${gapClass} ${splitGrid}`}>{media}{copy}</div> }
  if (section.type === 'story' && presentation === 'textFirst') {
    const media = <div className="mx-auto max-w-4xl px-7">{image('max-h-[36rem]')}</div>
    const copy = <div className="[&_[data-section-content]]:py-10 sm:[&_[data-section-content]]:py-12">{children}</div>
    return <div className={`grid ${gapClass} ${placement === 'bottom' ? 'pb-6 sm:pb-8' : ''}`}>{placement === 'top' ? <>{media}{copy}</> : <>{copy}{media}</>}</div>
  }
  return <><div className={section.type === 'hero' && presentation === 'immersive' ? 'w-full' : 'mx-auto mt-8 max-w-5xl px-6'}>{image(section.type === 'hero' && presentation === 'immersive' ? 'h-[clamp(20rem,62vw,52rem)]' : 'max-h-[38rem]')}</div>{children}</>
}

function semanticClass(viewport: ResponsiveViewport, tablet: string, desktop: string): string {
  return viewport === 'tablet' ? tablet : viewport === 'desktop' ? desktop : ''
}

function modernSplitGrid(placement: string, size: string, viewport: ResponsiveViewport): string {
  const tablet = placement === 'right'
    ? size === 'compact' ? 'grid-cols-[1.2fr_0.8fr]' : size === 'feature' ? 'grid-cols-[0.9fr_1.1fr]' : 'grid-cols-2'
    : size === 'compact' ? 'grid-cols-[0.8fr_1.2fr]' : size === 'feature' ? 'grid-cols-[1.1fr_0.9fr]' : 'grid-cols-2'
  const desktop = placement === 'right'
    ? size === 'compact' ? 'grid-cols-[1.25fr_0.75fr]' : size === 'feature' ? 'grid-cols-[0.8fr_1.2fr]' : 'grid-cols-2'
    : size === 'compact' ? 'grid-cols-[0.75fr_1.25fr]' : size === 'feature' ? 'grid-cols-[1.2fr_0.8fr]' : 'grid-cols-2'
  return viewport === 'tablet' ? tablet : viewport === 'desktop' ? desktop : ''
}

function ModernOuterFrameDecoration({ frame, placement }: { frame?: string; placement?: string }) {
  if (frame === 'outset') return <span className="pointer-events-none absolute inset-0 z-[2] border border-[var(--me-border)] outline outline-offset-[6px] outline-[color-mix(in_srgb,var(--me-text)_72%,transparent)] [border-radius:inherit]" aria-hidden="true" />
  if (frame !== 'editorialFrame') return null
  const facingRight = placement !== 'right'
  return <span className="pointer-events-none absolute inset-0 z-[2] outline outline-offset-4 outline-[var(--me-border)] [border-radius:inherit]" aria-hidden="true">
    <span className={`absolute top-1 size-7 border-t-2 border-[var(--me-text)] ${facingRight ? 'right-1 border-r-2' : 'left-1 border-l-2'}`} />
    <span className={`absolute bottom-1 size-7 border-b-2 border-[var(--me-text)] ${facingRight ? 'right-1 border-r-2' : 'left-1 border-l-2'}`} />
    <span className={`absolute bottom-1 top-1 w-px bg-[var(--me-border)] ${facingRight ? 'left-2' : 'right-2'}`} />
  </span>
}

function modernDecorationSafeArea(frame?: string, placement?: string) {
  if (frame === 'offset') return placement === 'right' ? 'pb-3 pl-3' : 'pb-3 pr-3'
  if (frame === 'gallery') return 'p-px'
  if (frame === 'outset') return 'p-[7px]'
  if (frame === 'editorialFrame') return 'p-[5px]'
  return ''
}
