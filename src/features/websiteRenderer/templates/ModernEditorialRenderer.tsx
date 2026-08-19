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
  const wrap = (content: React.ReactNode) => <>{section.mediaCapability && <SectionImage section={section} media={media} />}{content}</>
  switch (section.type) {
    case 'hero': return wrap(<ModernEditorialHero sectionId={section.id} eventName={eventName} date={date} content={section.content as HeroContent} />)
    case 'date': return <ModernEditorialDate sectionId={section.id} date={date} content={section.content as DateContent} />
    case 'story': return wrap(<ModernEditorialStory sectionId={section.id} content={section.content as StoryContent} />)
    case 'schedule': return <ModernEditorialSchedule sectionId={section.id} content={section.content as ScheduleContent} />
    case 'venue': return wrap(<ModernEditorialVenue sectionId={section.id} content={section.content as VenueContent} />)
    case 'dressCode': return <ModernEditorialDressCode sectionId={section.id} content={section.content as DressCodeContent} />
    case 'people': return <ModernEditorialPeople sectionId={section.id} content={section.content as PeopleContent} mode={mode} media={media} showMedia={section.itemMediaCapability?.itemType === 'person'} />
    case 'gallery': return <ModernEditorialGallery sectionId={section.id} content={section.content as GalleryContent} mode={mode} />
    case 'faq': return <ModernEditorialFaq sectionId={section.id} content={section.content as FaqContent} />
    case 'rsvp': return <ModernEditorialRsvp sectionId={section.id} content={section.content as RsvpContent} />
    default: return mode === 'editor' ? <div className="px-6 py-10 text-center text-sm text-[var(--me-muted)]">This section is not supported by this Template renderer.</div> : null
  }
}

function SectionImage({ section, media }: { section: WebsiteSection; media: Record<string, ResolvedWebsiteMedia> }) {
  const reference = (section.content as { media?: SectionMedia }).media
  const asset = reference ? media[reference.assetId] : undefined
  if (!asset) return null
  const point = reference?.focalPoint ?? { x: 0.5, y: 0.5 }
  return <div className={`overflow-hidden ${section.type === 'hero' ? 'w-full' : 'mx-auto mt-8 max-w-5xl px-6'}`}><img className={`w-full object-cover ${section.type === 'hero' ? 'h-[clamp(20rem,62vw,52rem)]' : 'max-h-[38rem]'}`} style={{ objectPosition: `${point.x * 100}% ${point.y * 100}%` }} src={asset.web.url} alt="" /></div>
}
