import type { DateContent, DressCodeContent, FaqContent, GalleryContent, HeroContent, RsvpContent, ScheduleContent, StoryContent, VenueContent, WebsiteSection } from '../../websiteEditor/types'
import { formatDateOnly } from '../formatDateOnly'
import type { WebsiteRendererProps } from '../types'
import { ClassicFilipinianaDate, ClassicFilipinianaDressCode, ClassicFilipinianaFaq, ClassicFilipinianaGallery, ClassicFilipinianaHero, ClassicFilipinianaRsvp, ClassicFilipinianaSchedule, ClassicFilipinianaStory, ClassicFilipinianaVenue } from './classicFilipiniana/sections'
import { resolveClassicFilipinianaDesign } from './classicFilipiniana/design'

export function ClassicFilipinianaRenderer({ event, website, mode = 'public', selectedSectionId, onSectionSelect }: WebsiteRendererProps) {
  const enabledSections = website.sections.filter(({ isEnabled }) => isEnabled)

  return <article className="min-h-full bg-[var(--cf-page)] font-[family-name:var(--cf-body-font)] text-[var(--cf-text)]" style={resolveClassicFilipinianaDesign(website.designSettings)}>
    {enabledSections.length === 0 && <div className="flex min-h-96 items-center justify-center px-8 text-center text-sm italic text-[var(--cf-muted)]">Enabled sections will appear here.</div>}
    {enabledSections.map((section, index) => (
      <section
        className={`${index % 2 ? 'bg-[color-mix(in_srgb,var(--cf-surface)_58%,transparent)]' : ''} relative cursor-default border-b border-[color-mix(in_srgb,var(--cf-border)_18%,transparent)] transition-shadow ${mode === 'editor' && selectedSectionId === section.id ? 'z-10 outline-2 outline-offset-[-3px] outline-[var(--cf-accent)]' : ''}`}
        data-preview-section={section.id}
        key={section.id}
        onClick={mode === 'editor' ? () => onSectionSelect?.(section.id) : undefined}
        onKeyDown={mode === 'editor' ? (event) => {
          if (event.target !== event.currentTarget) return
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSectionSelect?.(section.id) }
        } : undefined}
        role={mode === 'editor' ? 'group' : undefined}
        aria-label={mode === 'editor' ? `${section.displayName} section` : undefined}
        tabIndex={mode === 'editor' ? 0 : undefined}
      >
        {mode === 'editor' && selectedSectionId === section.id && <span className="absolute right-3 top-3 z-20 rounded-full bg-[var(--cf-accent)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white">Editing</span>}
        <Section section={section} eventName={event.name} eventDate={event.eventDate} mode={mode} />
      </section>
    ))}
  </article>
}

function Section({ section, eventName, eventDate, mode }: { section: WebsiteSection; eventName: string; eventDate: string | null; mode: 'editor' | 'public' }) {
  switch (section.type) {
    case 'hero': return <ClassicFilipinianaHero sectionId={section.id} eventName={eventName} content={section.content as HeroContent} />
    case 'date': return <ClassicFilipinianaDate sectionId={section.id} date={formatDateOnly(eventDate)} content={section.content as DateContent} />
    case 'story': return <ClassicFilipinianaStory sectionId={section.id} content={section.content as StoryContent} />
    case 'schedule': return <ClassicFilipinianaSchedule sectionId={section.id} content={section.content as ScheduleContent} />
    case 'venue': return <ClassicFilipinianaVenue sectionId={section.id} content={section.content as VenueContent} />
    case 'dressCode': return <ClassicFilipinianaDressCode sectionId={section.id} content={section.content as DressCodeContent} />
    case 'gallery': return <ClassicFilipinianaGallery sectionId={section.id} content={section.content as GalleryContent} mode={mode} />
    case 'faq': return <ClassicFilipinianaFaq sectionId={section.id} content={section.content as FaqContent} />
    case 'rsvp': return <ClassicFilipinianaRsvp sectionId={section.id} content={section.content as RsvpContent} />
    default: return mode === 'editor' ? <div className="px-6 py-10 text-center text-sm text-[var(--cf-muted)]">This section is not supported by this Template renderer.</div> : null
  }
}
