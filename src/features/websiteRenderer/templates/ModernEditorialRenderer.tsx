import type { DateContent, DressCodeContent, FaqContent, GalleryContent, HeroContent, RsvpContent, ScheduleContent, StoryContent, VenueContent, WebsiteSection } from '../../websiteEditor/types'
import { formatDateOnly } from '../formatDateOnly'
import type { WebsiteRendererProps } from '../types'
import { resolveModernEditorialSectionAppearance } from './modernEditorial/appearance'
import { resolveModernEditorialDesign } from './modernEditorial/design'
import { ModernEditorialDate, ModernEditorialDressCode, ModernEditorialFaq, ModernEditorialGallery, ModernEditorialHero, ModernEditorialRsvp, ModernEditorialSchedule, ModernEditorialStory, ModernEditorialVenue } from './modernEditorial/sections'

export function ModernEditorialRenderer({ event, website, mode = 'public', selectedSectionId, onSectionSelect }: WebsiteRendererProps) {
  const enabledSections = website.sections.filter(({ isEnabled }) => isEnabled)
  return <article className="min-h-full bg-[var(--me-page)] font-[family-name:var(--me-body-font)] text-[var(--me-text)]" style={resolveModernEditorialDesign(website.designSettings)}>
    {enabledSections.length === 0 && <div className="flex min-h-96 items-center justify-center px-8 text-center text-sm text-[var(--me-muted)]">Enabled sections will appear here.</div>}
    {enabledSections.map((section, index) => {
      const appearance = resolveModernEditorialSectionAppearance(section.type, section.appearance, index)
      return <section className={`${appearance.sectionClass} relative cursor-default border-b border-[var(--me-border)] transition-shadow ${mode === 'editor' && selectedSectionId === section.id ? 'z-10 outline-2 outline-offset-[-3px] outline-[var(--editor-chrome-focus)]' : ''}`} style={appearance.sectionStyle} data-preview-section={section.id} key={section.id} onClick={mode === 'editor' ? () => onSectionSelect?.(section.id) : undefined} onKeyDown={mode === 'editor' ? (keyboardEvent) => { if (keyboardEvent.target !== keyboardEvent.currentTarget) return; if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') { keyboardEvent.preventDefault(); onSectionSelect?.(section.id) } } : undefined} role={mode === 'editor' ? 'group' : undefined} aria-label={mode === 'editor' ? `${section.displayName} section` : undefined} tabIndex={mode === 'editor' ? 0 : undefined}>
        {mode === 'editor' && selectedSectionId === section.id && <span className="absolute right-3 top-3 z-20 rounded-full bg-[var(--editor-chrome-strong)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--editor-chrome-on-strong)] shadow-[var(--editor-chrome-shadow)]">Editing</span>}
        <Section section={section} eventName={event.name} eventDate={event.eventDate} mode={mode} />
      </section>
    })}
  </article>
}

function Section({ section, eventName, eventDate, mode }: { section: WebsiteSection; eventName: string; eventDate: string | null; mode: 'editor' | 'public' }) {
  const date = formatDateOnly(eventDate)
  switch (section.type) {
    case 'hero': return <ModernEditorialHero sectionId={section.id} eventName={eventName} date={date} content={section.content as HeroContent} />
    case 'date': return <ModernEditorialDate sectionId={section.id} date={date} content={section.content as DateContent} />
    case 'story': return <ModernEditorialStory sectionId={section.id} content={section.content as StoryContent} />
    case 'schedule': return <ModernEditorialSchedule sectionId={section.id} content={section.content as ScheduleContent} />
    case 'venue': return <ModernEditorialVenue sectionId={section.id} content={section.content as VenueContent} />
    case 'dressCode': return <ModernEditorialDressCode sectionId={section.id} content={section.content as DressCodeContent} />
    case 'gallery': return <ModernEditorialGallery sectionId={section.id} content={section.content as GalleryContent} mode={mode} />
    case 'faq': return <ModernEditorialFaq sectionId={section.id} content={section.content as FaqContent} />
    case 'rsvp': return <ModernEditorialRsvp sectionId={section.id} content={section.content as RsvpContent} />
    default: return mode === 'editor' ? <div className="px-6 py-10 text-center text-sm text-[var(--me-muted)]">This section is not supported by this Template renderer.</div> : null
  }
}
