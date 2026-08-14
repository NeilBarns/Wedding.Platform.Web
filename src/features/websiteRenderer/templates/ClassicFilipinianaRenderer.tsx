import type { DateContent, DressCodeContent, FaqContent, GalleryContent, HeroContent, RsvpContent, ScheduleContent, StoryContent, VenueContent, WebsiteSection } from '../../websiteEditor/types'
import { formatDateOnly } from '../formatDateOnly'
import type { WebsiteRendererProps } from '../types'
import { ClassicFilipinianaDate, ClassicFilipinianaDressCode, ClassicFilipinianaFaq, ClassicFilipinianaGallery, ClassicFilipinianaHero, ClassicFilipinianaRsvp, ClassicFilipinianaSchedule, ClassicFilipinianaStory, ClassicFilipinianaVenue } from './classicFilipiniana/sections'

export function ClassicFilipinianaRenderer({ event, website, mode = 'public', selectedSectionId, onSectionSelect }: WebsiteRendererProps) {
  const enabledSections = website.sections.filter(({ isEnabled }) => isEnabled)

  return <article className="min-h-full bg-[#f8f0e4] text-[#463b35]" style={{ backgroundImage: 'radial-gradient(rgb(117 91 70 / 7%) 0.7px, transparent 0.7px)', backgroundSize: '7px 7px' }}>
    {enabledSections.length === 0 && <div className="flex min-h-96 items-center justify-center px-8 text-center text-sm italic text-[#77695f]">Enabled sections will appear here.</div>}
    {enabledSections.map((section, index) => (
      <section
        className={`${index % 2 ? 'bg-[#f1e5d5]/55' : ''} relative cursor-default border-b border-[#806d5e]/15 transition-shadow ${mode === 'editor' && selectedSectionId === section.id ? 'z-10 outline-2 outline-offset-[-3px] outline-[#b36249]' : ''}`}
        data-preview-section={section.id}
        key={section.id}
        onClick={mode === 'editor' ? () => onSectionSelect?.(section.id) : undefined}
        onKeyDown={mode === 'editor' ? (event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSectionSelect?.(section.id) }
        } : undefined}
        role={mode === 'editor' ? 'button' : undefined}
        tabIndex={mode === 'editor' ? 0 : undefined}
      >
        {mode === 'editor' && selectedSectionId === section.id && <span className="absolute right-3 top-3 z-20 rounded-full bg-[#9d5b45] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white">Editing</span>}
        <Section section={section} eventName={event.name} eventDate={event.eventDate} mode={mode} />
      </section>
    ))}
  </article>
}

function Section({ section, eventName, eventDate, mode }: { section: WebsiteSection; eventName: string; eventDate: string | null; mode: 'editor' | 'public' }) {
  switch (section.type) {
    case 'hero': return <ClassicFilipinianaHero eventName={eventName} content={section.content as HeroContent} />
    case 'date': return <ClassicFilipinianaDate date={formatDateOnly(eventDate)} content={section.content as DateContent} />
    case 'story': return <ClassicFilipinianaStory content={section.content as StoryContent} />
    case 'schedule': return <ClassicFilipinianaSchedule content={section.content as ScheduleContent} />
    case 'venue': return <ClassicFilipinianaVenue content={section.content as VenueContent} />
    case 'dressCode': return <ClassicFilipinianaDressCode content={section.content as DressCodeContent} />
    case 'gallery': return <ClassicFilipinianaGallery content={section.content as GalleryContent} mode={mode} />
    case 'faq': return <ClassicFilipinianaFaq content={section.content as FaqContent} />
    case 'rsvp': return <ClassicFilipinianaRsvp content={section.content as RsvpContent} />
    default: return mode === 'editor' ? <div className="px-6 py-10 text-center text-sm text-[#77695f]">This section is not supported by this Template renderer.</div> : null
  }
}
