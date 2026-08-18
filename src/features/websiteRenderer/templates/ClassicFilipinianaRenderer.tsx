import type { DateContent, DressCodeContent, FaqContent, GalleryContent, HeroContent, ResolvedWebsiteMedia, RsvpContent, ScheduleContent, SectionMedia, StoryContent, VenueContent, WebsiteSection } from '../../websiteEditor/types'
import { formatDateOnly } from '../formatDateOnly'
import type { WebsiteRendererProps } from '../types'
import { ClassicFilipinianaDate, ClassicFilipinianaDressCode, ClassicFilipinianaFaq, ClassicFilipinianaGallery, ClassicFilipinianaHero, ClassicFilipinianaRsvp, ClassicFilipinianaSchedule, ClassicFilipinianaStory, ClassicFilipinianaVenue } from './classicFilipiniana/sections'
import { resolveClassicFilipinianaSectionAppearance } from './classicFilipiniana/appearance'
import { resolveClassicFilipinianaDesign } from './classicFilipiniana/design'

export function ClassicFilipinianaRenderer({ event, website, mode = 'public', selectedSectionId, onSectionSelect }: WebsiteRendererProps) {
  const enabledSections = website.sections.filter(({ isEnabled }) => isEnabled)

  return <article className="min-h-full bg-[var(--cf-page)] font-[family-name:var(--cf-body-font)] text-[var(--cf-text)]" style={resolveClassicFilipinianaDesign(website.designSettings)}>
    {enabledSections.length === 0 && <div className="flex min-h-96 items-center justify-center px-8 text-center text-sm italic text-[var(--cf-muted)]">Enabled sections will appear here.</div>}
    {enabledSections.map((section, index) => {
      const appearance = resolveClassicFilipinianaSectionAppearance(section.type, website.designSettings, section.appearance, index)
      return (
      <section
        className={`${appearance.sectionClass} relative cursor-default border-b border-[color-mix(in_srgb,var(--cf-border)_18%,transparent)] transition-shadow ${mode === 'editor' && selectedSectionId === section.id ? 'z-10 outline-2 outline-offset-[-3px] outline-[var(--editor-chrome-focus)]' : ''}`}
        style={appearance.sectionStyle}
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
        {mode === 'editor' && selectedSectionId === section.id && <span className="absolute right-3 top-3 z-20 rounded-full bg-[var(--editor-chrome-strong)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--editor-chrome-on-strong)] shadow-[var(--editor-chrome-shadow)]">Editing</span>}
        <Section section={section} eventName={event.name} eventDate={event.eventDate} mode={mode} media={website.media} />
      </section>
      )
    })}
  </article>
}

function Section({ section, eventName, eventDate, mode, media }: { section: WebsiteSection; eventName: string; eventDate: string | null; mode: 'editor' | 'public'; media: Record<string, ResolvedWebsiteMedia> }) {
  const wrap = (content: React.ReactNode) => <>{section.mediaCapability && <SectionImage section={section} media={media} />}{content}</>
  switch (section.type) {
    case 'hero': return wrap(<ClassicFilipinianaHero sectionId={section.id} eventName={eventName} content={section.content as HeroContent} />)
    case 'date': return <ClassicFilipinianaDate sectionId={section.id} date={formatDateOnly(eventDate)} content={section.content as DateContent} />
    case 'story': return wrap(<ClassicFilipinianaStory sectionId={section.id} content={section.content as StoryContent} />)
    case 'schedule': return <ClassicFilipinianaSchedule sectionId={section.id} content={section.content as ScheduleContent} />
    case 'venue': return wrap(<ClassicFilipinianaVenue sectionId={section.id} content={section.content as VenueContent} />)
    case 'dressCode': return <ClassicFilipinianaDressCode sectionId={section.id} content={section.content as DressCodeContent} />
    case 'gallery': return <ClassicFilipinianaGallery sectionId={section.id} content={section.content as GalleryContent} mode={mode} />
    case 'faq': return <ClassicFilipinianaFaq sectionId={section.id} content={section.content as FaqContent} />
    case 'rsvp': return <ClassicFilipinianaRsvp sectionId={section.id} content={section.content as RsvpContent} />
    default: return mode === 'editor' ? <div className="px-6 py-10 text-center text-sm text-[var(--cf-muted)]">This section is not supported by this Template renderer.</div> : null
  }
}

function SectionImage({ section, media }: { section: WebsiteSection; media: Record<string, ResolvedWebsiteMedia> }) {
  const reference = (section.content as { media?: SectionMedia }).media
  const asset = reference ? media[reference.assetId] : undefined
  if (!asset) return null
  const point = reference?.focalPoint ?? { x: 0.5, y: 0.5 }
  return <div className={`mx-auto overflow-hidden ${section.type === 'hero' ? 'max-h-[68vh] w-full' : 'mt-8 max-w-4xl rounded-sm px-6'}`}><img className={`w-full object-cover ${section.type === 'hero' ? 'h-[clamp(18rem,55vw,46rem)]' : 'max-h-[34rem]'}`} style={{ objectPosition: `${point.x * 100}% ${point.y * 100}%` }} src={asset.web.url} alt="" /></div>
}
