import type { DateContent, DressCodeContent, FaqContent, GalleryContent, HeroContent, PeopleContent, ResolvedWebsiteMedia, RsvpContent, ScheduleContent, SectionMedia, StoryContent, VenueContent, WebsiteSection } from '../../websiteEditor/types'
import { formatDateOnly } from '../formatDateOnly'
import type { WebsiteRendererProps } from '../types'
import { resolveModernEditorialSectionAppearance } from './modernEditorial/appearance'
import { resolveModernEditorialDesign } from './modernEditorial/design'
import { ModernEditorialDate, ModernEditorialDressCode, ModernEditorialFaq, ModernEditorialGallery, ModernEditorialHero, ModernEditorialPeople, ModernEditorialRsvp, ModernEditorialSchedule, ModernEditorialStory, ModernEditorialVenue } from './modernEditorial/sections'

export function ModernEditorialRenderer({ event, website, mode = 'public', selectedSectionId, onSectionSelect }: WebsiteRendererProps) {
  const enabledSections = website.sections.filter(({ isEnabled }) => isEnabled)
  return <article className="min-h-full bg-[var(--me-page)] font-[family-name:var(--me-body-font)] text-[var(--me-text)]" style={resolveModernEditorialDesign(website.designSettings)}>
    {enabledSections.length === 0 && <div className="flex min-h-96 items-center justify-center px-8 text-center text-sm text-[var(--me-muted)]">Enabled sections will appear here.</div>}
    {enabledSections.map((section, index) => {
      const appearance = resolveModernEditorialSectionAppearance(section.type, section.appearance, index)
      return <section className={`${appearance.sectionClass} relative cursor-default border-b border-[var(--me-border)] transition-shadow ${mode === 'editor' && selectedSectionId === section.id ? 'z-10 outline-2 outline-offset-[-3px] outline-[var(--editor-chrome-focus)]' : ''}`} style={appearance.sectionStyle} data-preview-section={section.id} key={section.id} onClick={mode === 'editor' ? () => onSectionSelect?.(section.id) : undefined} onKeyDown={mode === 'editor' ? (keyboardEvent) => { if (keyboardEvent.target !== keyboardEvent.currentTarget) return; if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') { keyboardEvent.preventDefault(); onSectionSelect?.(section.id) } } : undefined} role={mode === 'editor' ? 'group' : undefined} aria-label={mode === 'editor' ? `${section.displayName} section` : undefined} tabIndex={mode === 'editor' ? 0 : undefined}>
        {mode === 'editor' && selectedSectionId === section.id && <span className="absolute right-3 top-3 z-20 rounded-full bg-[var(--editor-chrome-strong)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--editor-chrome-on-strong)] shadow-[var(--editor-chrome-shadow)]">Editing</span>}
        <Section section={section} eventName={event.name} eventDate={event.eventDate} mode={mode} media={website.media} />
      </section>
    })}
  </article>
}

function Section({ section, eventName, eventDate, mode, media }: { section: WebsiteSection; eventName: string; eventDate: string | null; mode: 'editor' | 'public'; media: Record<string, ResolvedWebsiteMedia> }) {
  const date = formatDateOnly(eventDate)
  const presentation = section.appearance.presentation ?? section.presentationCapability?.default
  const present = (content: React.ReactNode) => <ModernMediaPresentation section={section} media={media} presentation={presentation}>{content}</ModernMediaPresentation>
  switch (section.type) {
    case 'hero': return present(<ModernEditorialHero sectionId={section.id} eventName={eventName} date={date} content={section.content as HeroContent} compact={presentation === 'framed'} />)
    case 'date': return <ModernEditorialDate sectionId={section.id} date={date} content={section.content as DateContent} />
    case 'story': return present(<ModernEditorialStory sectionId={section.id} content={section.content as StoryContent} />)
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

function ModernMediaPresentation({ section, media, presentation, children }: { section: WebsiteSection; media: Record<string, ResolvedWebsiteMedia>; presentation?: string; children: React.ReactNode }) {
  const reference = (section.content as { media?: SectionMedia }).media
  const asset = reference ? media[reference.assetId] : undefined
  if (!section.mediaCapability || !asset) return <>{children}</>
  const point = reference?.focalPoint ?? { x: 0.5, y: 0.5 }
  const image = (className: string) => <img className={`w-full object-cover ${className}`} style={{ objectPosition: `${point.x * 100}% ${point.y * 100}%` }} src={asset.web.url} alt="" />

  if (presentation === 'scenic') return <div className="relative isolate min-h-[36rem] overflow-hidden">{image('absolute inset-0 h-full')}<div className="relative min-h-[36rem] bg-[color-mix(in_srgb,var(--me-page)_72%,transparent)] backdrop-blur-[1px]">{children}</div></div>
  if (presentation === 'editorial') return <div className="grid items-stretch lg:grid-cols-[1.05fr_0.95fr]">{image('h-full min-h-[28rem] max-h-[52rem]')}<div>{children}</div></div>
  if (presentation === 'detailsFirst') return <div className="grid items-stretch lg:grid-cols-[1.15fr_0.85fr]"><div>{children}</div>{image('h-full min-h-[25rem] max-h-[44rem]')}</div>
  if (presentation === 'textFirst') return <>{children}<div className="mx-auto max-w-4xl px-7 pb-16">{image('max-h-[36rem]')}</div></>
  if (section.type === 'hero' && presentation === 'framed') return <div className="mx-auto grid max-w-7xl gap-6 px-5 pb-8 pt-5 sm:gap-8 sm:px-8 sm:pb-12 sm:pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"><div className="border border-[var(--me-border)] bg-[var(--me-page)] p-2 sm:p-3">{image('h-[clamp(18rem,48vw,34rem)]')}</div><div>{children}</div></div>
  if (section.type === 'story' && presentation === 'framed') return <div className="mx-auto max-w-6xl px-5 pb-8 pt-5 sm:px-10 sm:pb-12 sm:pt-8"><div className="border border-[var(--me-border)] bg-[var(--me-page)] p-2 sm:p-3">{image('h-[clamp(15rem,36vw,24rem)]')}</div><div className="[&_[data-section-content]]:px-2 [&_[data-section-content]]:pb-8 [&_[data-section-content]]:pt-9 sm:[&_[data-section-content]]:px-6 sm:[&_[data-section-content]]:pb-10 sm:[&_[data-section-content]]:pt-12">{children}</div></div>
  if (section.type === 'venue' && presentation === 'framed') return <div className="mx-auto max-w-6xl px-5 pb-8 pt-5 sm:px-10 sm:pb-12 sm:pt-8"><div className="border border-[var(--me-border)] bg-[var(--me-page)] p-2 sm:p-3">{image('h-[clamp(15rem,34vw,22rem)]')}</div><div className="[&_[data-section-content]]:px-2 [&_[data-section-content]]:pb-8 [&_[data-section-content]]:pt-8 sm:[&_[data-section-content]]:px-6 sm:[&_[data-section-content]]:pb-10 sm:[&_[data-section-content]]:pt-10">{children}</div></div>

  return <><div className={`overflow-hidden ${section.type === 'hero' && presentation === 'immersive' ? 'w-full' : 'mx-auto mt-8 max-w-5xl px-6'}`}>{image(section.type === 'hero' && presentation === 'immersive' ? 'h-[clamp(20rem,62vw,52rem)]' : 'max-h-[38rem]')}</div>{children}</>
}
